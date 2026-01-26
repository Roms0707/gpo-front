import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, Clock, Calendar, Globe, ExternalLink, Loader, AlertTriangle, Trophy, Share2, PlayCircle } from 'lucide-react';
import { fetchVideoContentById, fetchRelatedGameContent } from '../services/api';
import { GameContent } from '../types';
import toast from 'react-hot-toast';
import VideoCard from '../components/ui/VideoCard';
import ShareVideoModal from '../components/ui/ShareVideoModal';
import { useAuth } from '../contexts/AuthContext';
import { saveVideoProgress, getVideoProgress } from '../services/playlistService';

const loadHls = () => import('hls.js');

const MAX_RETRIES = 3;
const PROGRESS_SAVE_INTERVAL = 10000;

const VideoPlayerPage: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState<GameContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<GameContent[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [hasMoreRelatedVideos, setHasMoreRelatedVideos] = useState(false);
  const [currentPageRelatedVideos, setCurrentPageRelatedVideos] = useState(1);
  const [totalRelatedVideos, setTotalRelatedVideos] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    if (contentId) {
      loadVideoContent();
    }
  }, [contentId]);

  useEffect(() => {
    if (content && content.game_id && content.galaxy_rubric_id) {
      loadRelatedVideos();
    }
  }, [content]);

  useEffect(() => {
    const loadSavedProgress = async () => {
      if (user?.id && contentId) {
        const progress = await getVideoProgress(user.id, contentId);
        if (progress && !progress.is_completed && progress.watch_time_seconds > 0) {
          setSavedProgress(progress.watch_time_seconds);
        }
      }
    };
    loadSavedProgress();
  }, [user?.id, contentId]);

  useEffect(() => {
    if (savedProgress > 0 && !hasRestoredProgress && videoRef.current && duration > 0) {
      if (savedProgress < duration - 5) {
        videoRef.current.currentTime = savedProgress;
        setCurrentTime(savedProgress);
      }
      setHasRestoredProgress(true);
    }
  }, [savedProgress, hasRestoredProgress, duration]);

  useEffect(() => {
    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
      if (user?.id && contentId && currentTime > 0 && duration > 0) {
        saveVideoProgress(user.id, contentId, Math.floor(currentTime), Math.floor(duration));
      }
    };
  }, [user?.id, contentId, currentTime, duration]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize HLS player when content is loaded
  useEffect(() => {
    if (content && videoRef.current) {
      initializeHLSPlayer();
    }

    // Cleanup HLS instance on unmount or content change
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [content]);

  const initializeHLSPlayer = useCallback(() => {
    if (!content || !videoRef.current) return;

    const video = videoRef.current;
    const videoUrl = content.content_url;

    // Clean up existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if the URL is an M3U8 file (HLS stream)
    const isHLS = videoUrl.includes('.m3u8') || videoUrl.includes('m3u8');

    if (isHLS) {
      // Use hls.js for HLS streams
      console.log('Initializing HLS player for:', videoUrl);

      // Dynamically load HLS.js
      loadHls().then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });

          hlsRef.current = hls;

          // Load the HLS stream
          hls.loadSource(videoUrl);
          hls.attachMedia(video);

          // Handle HLS events
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed successfully');
            setRetryCount(0);
            setIsVideoLoading(false);
            setVideoError(null);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  if (retryCount < MAX_RETRIES) {
                    console.log(`Fatal network error encountered, retrying... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                    setRetryCount(prev => prev + 1);
                    setVideoError(null);
                    hls.destroy();
                    hlsRef.current = null;

                    retryTimeoutRef.current = setTimeout(() => {
                      initializeHLSPlayer();
                    }, 2000);
                  } else {
                    console.error('Max retries reached, giving up');
                    setVideoError('Erreur réseau lors du chargement de la vidéo. Veuillez réessayer plus tard.');
                    setRetryCount(0);
                    hls.destroy();
                    hlsRef.current = null;
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('Fatal media error encountered, trying to recover...');
                  setVideoError('Erreur de décodage de la vidéo');
                  hls.recoverMediaError();
                  break;
                default:
                  console.log('Fatal error, cannot recover');
                  setVideoError('Erreur fatale lors de la lecture de la vidéo');
                  hls.destroy();
                  hlsRef.current = null;
                  break;
              }
            } else {
              console.warn('HLS non-fatal error:', data.type, data.details);
            }
          });

          hls.on(Hls.Events.FRAG_LOADING, () => {
            setIsVideoLoading(true);
          });

          hls.on(Hls.Events.FRAG_LOADED, () => {
            setIsVideoLoading(false);
          });
        } else {
          setVideoError('Format vidéo HLS non supporté par ce navigateur');
          setIsVideoLoading(false);
        }
      }).catch(error => {
        console.error('Error loading HLS.js:', error);
        setVideoError('Erreur lors du chargement du lecteur vidéo');
        setIsVideoLoading(false);
      });

    } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('Using native HLS support for:', videoUrl);
      video.src = videoUrl;
      setIsVideoLoading(false);
      setVideoError(null);
    } else if (isHLS) {
      // HLS not supported
      console.error('HLS not supported in this browser');
      setVideoError('Format vidéo HLS non supporté par ce navigateur');
      setIsVideoLoading(false);
    } else {
      // Regular video file
      console.log('Loading regular video file:', videoUrl);
      video.src = videoUrl;
      setIsVideoLoading(false);
      setVideoError(null);
    }
  }, [content, retryCount]);

  const loadVideoContent = async () => {
    if (!contentId) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchVideoContentById(contentId);
      setContent(data);
    } catch (err) {
      console.error('Error loading video content:', err);
      setError('Erreur lors du chargement de la vidéo');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedVideos = async () => {
    if (!content || !content.game_id || !content.galaxy_rubric_id) return;

    try {
      setIsLoadingRelated(true);

      // Load initial 4 videos
      const result = await fetchRelatedGameContent(content.game_id, content.galaxy_rubric_id, content.id, 1, 4);

      setRelatedVideos(result.data);
      setHasMoreRelatedVideos(result.hasMore);
      setTotalRelatedVideos(result.totalCount);
      setCurrentPageRelatedVideos(1);

      console.log('Related videos loaded:', {
        count: result.data.length,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
        currentPage: 1
      });
    } catch (err) {
      console.error('Error loading related videos:', err);
      setRelatedVideos([]);
      setHasMoreRelatedVideos(false);
      setTotalRelatedVideos(0);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const loadMoreRelatedVideos = async () => {
    if (!content || !content.game_id || !content.galaxy_rubric_id || !hasMoreRelatedVideos || isLoadingRelated) return;

    try {
      setIsLoadingRelated(true);

      const nextPage = currentPageRelatedVideos + 1;
      const result = await fetchRelatedGameContent(content.game_id, content.galaxy_rubric_id, content.id, nextPage, 4);

      // Append new videos to existing ones
      setRelatedVideos(prev => [...prev, ...result.data]);
      setHasMoreRelatedVideos(result.hasMore);
      setCurrentPageRelatedVideos(nextPage);

      console.log('More related videos loaded:', {
        newCount: result.data.length,
        totalLoaded: relatedVideos.length + result.data.length,
        hasMore: result.hasMore,
        currentPage: nextPage
      });
    } catch (err) {
      console.error('Error loading more related videos:', err);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const handleViewTournaments = () => {
    if (content?.game_id) {
      navigate(`/?game=${content.game_id}`);
    }
  };

  const handleShareVideo = async () => {
    setShowShareModal(true);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const newTime = videoRef.current.currentTime;
    setCurrentTime(newTime);

    if (user?.id && contentId && duration > 0) {
      const timeSinceLastSave = Date.now() - lastSavedTimeRef.current;
      if (timeSinceLastSave >= PROGRESS_SAVE_INTERVAL) {
        lastSavedTimeRef.current = Date.now();
        saveVideoProgress(user.id, contentId, Math.floor(newTime), Math.floor(duration));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsVideoLoading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoError = () => {
    console.error('Video element error event fired');

    // Don't override HLS-specific errors
    if (!hlsRef.current) {
      setVideoError('Erreur lors du chargement de la vidéo');
    }
    setIsVideoLoading(false);
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false);
    setVideoError(null);
  };

  const restartVideo = () => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(error => {
      console.error('Error playing video:', error);
      setVideoError('Erreur lors de la lecture de la vidéo');
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Link>

            <div className="bg-white dark:bg-dark-100 rounded-xl p-8 border border-gray-200 dark:border-gray-800">
              <AlertTriangle className="h-16 w-16 text-error-500 mx-auto mb-4" />
              <h1 className="font-heading font-bold text-2xl mb-4 text-gray-900 dark:text-white">Vidéo non trouvée</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'La vidéo demandée n\'a pas pu être trouvée.'}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="btn btn-primary"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center text-white hover:text-gray-300 transition-colors bg-dark-100/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </button>
            </div>
          </div>

          {/* Video Player Container */}
          <div
            ref={containerRef}
            className={`relative bg-black rounded-xl overflow-hidden ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'
            }`}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => {
                setIsPlaying(false);
                if (user?.id && contentId && currentTime > 0 && duration > 0) {
                  saveVideoProgress(user.id, contentId, Math.floor(currentTime), Math.floor(duration));
                }
              }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onCanPlay={handleVideoCanPlay}
              onWaiting={() => setIsVideoLoading(true)}
              onPlaying={() => setIsVideoLoading(false)}
              onEnded={() => {
                if (user?.id && contentId && duration > 0) {
                  saveVideoProgress(user.id, contentId, Math.floor(duration), Math.floor(duration));
                }
              }}
              poster={content.playlist_image_url}
              preload="metadata"
              controls={false}
              autoPlay
              muted
              playsInline
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>

            {/* Loading Overlay */}
            {isVideoLoading && !videoError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader className="h-12 w-12 animate-spin mx-auto mb-4" />
                  <p>Chargement de la vidéo...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {videoError && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-error-400" />
                  <p className="mb-4">{videoError}</p>
                  <button
                    onClick={() => {
                      setVideoError(null);
                      setRetryCount(0);
                      setIsVideoLoading(true);
                      initializeHLSPlayer();
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-primary-400 transition-colors"
                    disabled={videoError !== null}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                  </button>

                  <button
                    onClick={restartVideo}
                    className="text-white hover:text-primary-400 transition-colors"
                    disabled={videoError !== null}
                  >
                    <RotateCcw className="h-6 w-6" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-primary-400 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="h-6 w-6" />
                      ) : (
                        <Volume2 className="h-6 w-6" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-primary-400 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-6 w-6" />
                    ) : (
                      <Maximize className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Information */}
          {!isFullscreen && (
            <div className="mt-8 space-y-8">
              {/* Video Information */}
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Info */}
                  <div className="lg:col-span-2">
                    <h1 className="font-heading font-bold text-2xl mb-4 text-gray-900 dark:text-white">
                      {content.title}
                    </h1>

                    {content.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                        {content.description}
                      </p>
                    )}

                    {/* Video Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {content.duration && (
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-primary-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Durée</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {Math.floor(content.duration / 60)}:{(content.duration % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>
                      )}

                      {content.product_year && (
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-primary-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Année</p>
                            <p className="font-medium text-gray-900 dark:text-white">{content.product_year}</p>
                          </div>
                        </div>
                      )}

                      {content.product_country && (
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 text-primary-500 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pays</p>
                            <p className="font-medium text-gray-900 dark:text-white">{content.product_country}</p>
                          </div>
                        </div>
                      )}

                      {content.theme_label && (
                        <div className="flex items-center">
                          <div className="w-5 h-5 bg-primary-500 rounded mr-2"></div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Thème</p>
                            <p className="font-medium text-gray-900 dark:text-white">{content.theme_label}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Game Info */}
                    {content.games && (
                      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Jeu associé</h3>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center mr-3">
                            <Play className="h-5 w-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{content.games.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{content.games.publisher}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      <button
                        onClick={handleViewTournaments}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Voir les tournois de ce jeu
                      </button>

                      <button
                        onClick={handleShareVideo}
                        className="w-full bg-secondary-600 hover:bg-secondary-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager cette vidéo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Videos Section */}
              {(relatedVideos.length > 0 || isLoadingRelated || totalRelatedVideos > 0) && (
                <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center mb-6">
                    <PlayCircle className="h-6 w-6 text-primary-500 mr-2" />
                    <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                      Vidéos suivantes
                    </h2>
                    {totalRelatedVideos > 0 && (
                      <span className="ml-2 text-sm bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full">
                        {relatedVideos.length} / {totalRelatedVideos} vidéos
                      </span>
                    )}
                  </div>

                  {isLoadingRelated && relatedVideos.length === 0 ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader className="h-8 w-8 animate-spin text-primary-500" />
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement des vidéos similaires...</span>
                    </div>
                  ) : relatedVideos.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {relatedVideos.map(video => (
                          <VideoCard
                            key={video.id}
                            content={video}
                            showMetadata={true}
                            className="hover:scale-105 transition-transform duration-200"
                          />
                        ))}
                      </div>

                      {/* Load More Button */}
                      {hasMoreRelatedVideos && (
                        <div className="text-center mt-8">
                          <button
                            onClick={loadMoreRelatedVideos}
                            disabled={isLoadingRelated}
                            className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center mx-auto"
                          >
                            {isLoadingRelated ? (
                              <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                Chargement...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Charger plus de vidéos ({totalRelatedVideos - relatedVideos.length} restantes)
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Aucune vidéo similaire trouvée
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Video Modal */}
      <ShareVideoModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        videoTitle={content?.title || 'Vidéo de gaming'}
        videoUrl={window.location.href}
        videoDescription={content?.description}
        videoThumbnail={content?.playlist_image_url}
      />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ff7900;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ff7900;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayerPage;
