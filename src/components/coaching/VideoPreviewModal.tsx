import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, Clock, Play, Pause, Maximize2 } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface VideoData {
  content_id: string;
  title: string;
  description?: string;
  content_url?: string;
  playlist_image_url?: string;
  duration?: number;
}

interface VideoPreviewModalProps {
  video: VideoData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPage?: (contentId: string) => void;
  theme: GameTheme;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  video,
  isOpen,
  onClose,
  onOpenFullPage,
  theme
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleOpenFullPage = () => {
    if (video && onOpenFullPage) {
      onOpenFullPage(video.content_id);
      onClose();
    }
  };

  if (!isOpen || !video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-dark-200 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: `1px solid ${theme.colors.primary}30`
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: `${theme.colors.primary}10`,
            borderBottom: `1px solid ${theme.colors.primary}20`
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <Play className="w-4 h-4" style={{ color: theme.colors.primary }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate text-sm">
                {video.title}
              </h3>
              {video.duration && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.duration)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black">
          {video.content_url ? (
            <>
              <video
                ref={videoRef}
                src={video.content_url}
                poster={video.playlist_image_url}
                className="w-full h-full object-contain"
                controls={false}
                onClick={togglePlay}
              />

              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Play className="w-7 h-7 text-white ml-1" />
                  </div>
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleOpenFullPage}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Open in full page"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {video.playlist_image_url ? (
                <img
                  src={video.playlist_image_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Video preview not available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {video.description && (
          <div className="p-4 border-t border-gray-800">
            <p className="text-sm text-gray-400 line-clamp-3">
              {video.description}
            </p>
          </div>
        )}

        <div
          className="px-4 py-3 flex items-center justify-end gap-2"
          style={{ borderTop: `1px solid ${theme.colors.primary}15` }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
          {onOpenFullPage && (
            <button
              onClick={handleOpenFullPage}
              className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.text
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open Full Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;
