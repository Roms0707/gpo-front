import React from 'react';
import { Play, Satellite } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VideoPlaceholderProps {
  onPlay?: () => void;
  isExpanded?: boolean;
}

const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ onPlay, isExpanded = false }) => {
  const { t } = useTranslation();

  if (!isExpanded) return null;

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dark-300 border border-gray-700/50">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary-500/10 border-2 border-primary-500/20 flex items-center justify-center placeholder-pulse">
            <Satellite className="w-8 h-8 text-primary-400" />
          </div>
        </div>

        <div className="text-center px-4">
          <p className="text-white font-semibold text-lg mb-1">
            {t('masterclasses.galaxyComingSoon')}
          </p>
          <p className="text-gray-400 text-sm">
            {t('masterclasses.galaxyComingSoonDesc')}
          </p>
        </div>

        <button
          onClick={onPlay}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-700/50 text-gray-300 text-sm font-medium border border-gray-600/50 cursor-not-allowed opacity-60"
          disabled
        >
          <Play className="w-4 h-4" />
          {t('masterclasses.playEpisode')}
        </button>
      </div>

      <div className="absolute inset-0 rounded-xl border border-primary-500/10 placeholder-border-pulse pointer-events-none" />

      <style>{`
        .placeholder-pulse {
          animation: placeholderPulse 3s ease-in-out infinite;
        }
        .placeholder-border-pulse {
          animation: borderPulse 3s ease-in-out infinite;
        }
        @keyframes placeholderPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 121, 0, 0); }
          50% { box-shadow: 0 0 30px 5px rgba(255, 121, 0, 0.08); }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(255, 121, 0, 0.05); }
          50% { border-color: rgba(255, 121, 0, 0.15); }
        }
      `}</style>
    </div>
  );
};

export default VideoPlaceholder;
