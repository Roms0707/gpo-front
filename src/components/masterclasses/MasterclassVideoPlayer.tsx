import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, Loader, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MasterclassVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onEnded?: () => void;
}

const MAX_RETRIES = 3;
const loadHls = () => import('hls.js');

const MasterclassVideoPlayer: React.FC<MasterclassVideoPlayerProps> = ({ videoUrl, thumbnailUrl, onEnded }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const initializePlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    destroyHls();
    setIsLoading(true);
    setError(null);

    const isHLS = videoUrl.includes('.m3u8') || videoUrl.includes('m3u8');

    if (isHLS) {
      loadHls()
        .then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
            });
            hlsRef.current = hls;

            hls.loadSource(videoUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setRetryCount(0);
              setIsLoading(false);
              setError(null);
            });

            hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
              if (data.fatal) {
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                  if (retryCount < MAX_RETRIES) {
                    setRetryCount((prev) => prev + 1);
                    hls.destroy();
                    hlsRef.current = null;
                    retryTimeoutRef.current = setTimeout(() => initializePlayer(), 2000);
                  } else {
                    setError(t('masterclasses.videoError'));
                    setRetryCount(0);
                    hls.destroy();
                    hlsRef.current = null;
                  }
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                  hls.recoverMediaError();
                } else {
                  setError(t('masterclasses.videoError'));
                  hls.destroy();
                  hlsRef.current = null;
                }
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
            setIsLoading(false);
          } else {
            setError(t('masterclasses.videoError'));
            setIsLoading(false);
          }
        })
        .catch(() => {
          setError(t('masterclasses.videoError'));
          setIsLoading(false);
        });
    } else {
      video.src = videoUrl;
      setIsLoading(false);
    }
  }, [videoUrl, retryCount, destroyHls, t]);

  useEffect(() => {
    initializePlayer();
    return destroyHls;
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded_ = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded_);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded_);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, [onEnded]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!hasStarted) setHasStarted(true);
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    initializePlayer();
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark-300 border border-gray-700/50 flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-amber-400/80" />
        <p className="text-gray-300 text-sm text-center px-4">{error}</p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium hover:bg-primary-500/30 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t('masterclasses.retryLoad')}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group cursor-pointer"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted={isMuted}
        poster={thumbnailUrl}
      />

      {!hasStarted && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-16 h-16 rounded-full bg-primary-500/90 flex items-center justify-center shadow-lg shadow-primary-500/30 hover:bg-primary-500 transition-colors">
            <Play className="w-7 h-7 text-white ml-1" />
          </div>
        </div>
      )}

      {isLoading && hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-3 px-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/seek hover:h-2.5 transition-all"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-primary-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary-400 shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-primary-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <span className="text-white/70 text-xs font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-primary-400 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterclassVideoPlayer;
