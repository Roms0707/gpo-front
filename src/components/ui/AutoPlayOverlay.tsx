import React, { useState, useEffect, useCallback } from 'react';
import { Play, X, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GalaxyContentItem } from '../../types/galaxy';
import ContentBadge from './ContentBadge';
import { BadgeType } from '../../services/badgeService';

interface AutoPlayOverlayProps {
  nextVideo: GalaxyContentItem;
  badges?: BadgeType[];
  countdownSeconds?: number;
  onPlay: () => void;
  onCancel: () => void;
}

const AutoPlayOverlay: React.FC<AutoPlayOverlayProps> = ({
  nextVideo,
  badges = [],
  countdownSeconds = 5,
  onPlay,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onPlay();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onPlay]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  }, [onCancel]);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  }, [onPlay]);

  const progress = ((countdownSeconds - remaining) / countdownSeconds) * 100;
  const circumference = 2 * Math.PI * 22;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('videoPlayer.upNext', 'Up Next')}
        </p>

        <div className="relative cursor-pointer group" onClick={handlePlay}>
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24" cy="24" r="22"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2.5"
            />
            <circle
              cx="24" cy="24" r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="text-primary-500 transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{remaining}</span>
          </div>
        </div>

        <div
          className="flex items-center gap-3 bg-white/5 rounded-xl p-3 w-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={handlePlay}
        >
          {nextVideo.thumbnail_url ? (
            <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={nextVideo.thumbnail_url}
                alt={nextVideo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="currentColor" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 text-white/60" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white line-clamp-1">{nextVideo.title}</h4>
            {badges.length > 0 && (
              <div className="flex gap-1 mt-1">
                {badges.slice(0, 1).map((b) => (
                  <ContentBadge key={b} type={b} size="sm" />
                ))}
              </div>
            )}
          </div>
          <SkipForward className="w-5 h-5 text-white/60 flex-shrink-0 group-hover:text-white transition-colors" />
        </div>

        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mt-1"
        >
          <X className="w-3.5 h-3.5" />
          {t('common.cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );
};

export default AutoPlayOverlay;
