import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trophy, Users, Clock, Swords, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlayerMatchNotification } from '../../types';
import toast from 'react-hot-toast';

interface BracketReadyModalProps {
  notification: PlayerMatchNotification;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

const BracketReadyModal: React.FC<BracketReadyModalProps> = ({
  notification,
  onClose,
  onMarkAsRead
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  }, []);

  useEffect(() => {
    const calculateCountdown = () => {
      if (!notification.metadata?.tournament_start_time) return;

      const startTime = new Date(notification.metadata.tournament_start_time).getTime();
      const now = new Date().getTime();
      const distance = startTime - now;

      if (distance < 0) {
        setCountdown(t('notifications.tournamentStarted'));
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [notification.metadata?.tournament_start_time]);

  const handleClose = async () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAccept = async () => {
    await onMarkAsRead(notification.id);
    navigate(`/tournaments/${notification.tournament_id}?tab=bracket`);
    handleClose();
  };

  const handleViewBracket = () => {
    navigate(`/tournaments/${notification.tournament_id}?tab=bracket`);
    handleClose();
  };

  const metadata = notification.metadata || {};

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bracket-ready-title"
    >
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`relative w-full max-w-3xl pointer-events-auto transform transition-all duration-500 ${
            isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnpNNTQgMzZjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6TTE4IDM2YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L2c+PC9zdmc+')] opacity-30"></div>

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label={t('notifications.close')}
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative p-8 md:p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-2xl">
                  <Swords className="h-12 w-12 md:h-16 md:w-16 text-white animate-pulse" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    {t('notifications.bracketGenerated')}
                  </span>
                </div>

                <h2
                  id="bracket-ready-title"
                  className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-white drop-shadow-lg"
                >
                  {t('notifications.yourMatchIsReady')}
                </h2>

                {metadata.tournament_title && (
                  <p className="text-xl md:text-2xl font-semibold text-white/90">
                    {metadata.tournament_title}
                  </p>
                )}
              </div>

              {countdown && (
                <div className="w-full max-w-md">
                  <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <Clock className="h-5 w-5 text-warning-300" />
                      <span className="text-sm font-medium text-white/80 uppercase tracking-wide">
                        {t('notifications.startsIn')}
                      </span>
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-white font-mono tabular-nums">
                      {countdown}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-6 w-full max-w-lg">
                {metadata.total_participants && (
                  <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20">
                    <Users className="h-6 w-6 text-white/90" />
                    <div className="text-left">
                      <div className="text-2xl font-bold text-white">
                        {metadata.total_participants}
                      </div>
                      <div className="text-xs text-white/70 uppercase tracking-wide">
                        {t('notifications.participants')}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20">
                  <Trophy className="h-6 w-6 text-warning-400" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">
                      Round 1
                    </div>
                    <div className="text-xs text-white/70 uppercase tracking-wide">
                      {t('notifications.yourRound')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 w-full max-w-2xl">
                <p className="text-white/90 text-base md:text-lg leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 font-semibold border border-white/30 hover:border-white/50"
              >
                {t('notifications.later')}
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-6 py-4 bg-white hover:bg-gray-100 text-primary-900 rounded-xl transition-all duration-200 font-bold flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span>{t('notifications.viewBracket')}</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute -inset-4 bg-gradient-to-r from-primary-500 via-warning-500 to-primary-500 rounded-3xl opacity-20 blur-xl -z-10 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default BracketReadyModal;
