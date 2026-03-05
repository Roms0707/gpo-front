import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trophy, CheckCircle, Gamepad2, Link as LinkIcon } from 'lucide-react';
import { GameTheme, getGameTheme } from '../../utils/gameThemes';

export interface GameActivity {
  gameId: string;
  gameName: string;
  imageUrl?: string;
  coverUrl?: string;
  score: number;
  tournamentCount: number;
  hasRanking: boolean;
  isValidated: boolean;
  eloRating?: number;
  rank?: number;
  wins?: number;
  losses?: number;
}

interface GameStatsCarouselProps {
  gameActivities: GameActivity[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
  onViewDetails: (gameId: string) => void;
  theme: GameTheme;
}

const FALLBACK_COVER = 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2';

const GameStatsCarousel: React.FC<GameStatsCarouselProps> = ({
  gameActivities,
  selectedGameId,
  onSelectGame,
  onViewDetails,
  theme,
}) => {
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedGame = useMemo(
    () => gameActivities.find((g) => g.gameId === selectedGameId) || gameActivities[0],
    [gameActivities, selectedGameId]
  );

  const selectedTheme = useMemo(
    () => (selectedGame ? getGameTheme(selectedGame.gameName) : theme),
    [selectedGame, theme]
  );

  if (gameActivities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-8 text-center"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.85)',
          border: `1px solid ${theme.colors.primary}20`,
        }}
      >
        <LinkIcon className="w-10 h-10 mx-auto mb-3 text-gray-500" />
        <h3 className="text-white font-medium mb-1">{t('gaming.noGamesYet')}</h3>
        <p className="text-sm text-gray-400">{t('gaming.connectFirstGame')}</p>
      </motion.div>
    );
  }

  const getGameCover = (game: GameActivity): string => {
    return game.coverUrl || game.imageUrl || FALLBACK_COVER;
  };

  const getSnippet = (game: GameActivity): string => {
    if (game.hasRanking && game.eloRating) {
      return `Rank #${game.rank || '-'} - ${game.eloRating.toLocaleString()} ELO`;
    }
    if (game.isValidated) {
      return t('gaming.accountValidatedStatus');
    }
    if (game.tournamentCount > 0) {
      return t('gaming.tournamentsPlayedCount', { count: game.tournamentCount });
    }
    return t('gaming.noRankData');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(30, 30, 30, 0.85)',
        border: `1px solid ${selectedTheme.colors.primary}20`,
      }}
    >
      <div className="p-4 pb-0">
        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4" style={{ color: selectedTheme.colors.primary }} />
          {t('gaming.yourGames')}
        </h3>

        <div className="flex items-center justify-center gap-3 flex-wrap pb-2">
          {gameActivities.map((game) => {
            const gameTheme = getGameTheme(game.gameName);
            const isActive = game.gameId === (selectedGameId || gameActivities[0]?.gameId);
            const isHovered = game.gameId === hoveredId;

            return (
              <button
                key={game.gameId}
                onClick={() => onSelectGame(game.gameId)}
                onMouseEnter={() => setHoveredId(game.gameId)}
                onMouseLeave={() => setHoveredId(null)}
                className="focus:outline-none transition-all duration-300 relative group"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    borderColor: isActive
                      ? gameTheme.colors.primary
                      : 'rgba(75, 85, 99, 0.5)',
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 rounded-xl overflow-hidden border-2"
                  style={{
                    boxShadow: isActive
                      ? `0 0 16px ${gameTheme.colors.glow}, 0 0 24px ${gameTheme.colors.glow}66`
                      : 'none',
                  }}
                >
                  <img
                    src={getGameCover(game)}
                    alt={game.gameName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_COVER;
                    }}
                  />
                </motion.div>

                {isActive && (
                  <motion.div
                    layoutId="carousel-active-ring"
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${gameTheme.colors.primary}40 0%, transparent 70%)`,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {(isHovered || isActive) && (
                  <div
                    className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded bg-white/90 dark:bg-dark-300/90 shadow-lg z-20 pointer-events-none"
                    style={{ color: gameTheme.colors.primary }}
                  >
                    {game.gameName}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedGame && (
          <motion.div
            key={selectedGame.gameId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-4 pt-6"
          >
            <div
              className="rounded-xl p-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${selectedTheme.colors.primary}15 0%, ${selectedTheme.colors.secondary}08 100%)`,
                border: `1px solid ${selectedTheme.colors.primary}25`,
              }}
            >
              <div
                className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-15"
                style={{ backgroundColor: selectedTheme.colors.primary }}
              />

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ border: `2px solid ${selectedTheme.colors.primary}50` }}
                  >
                    <img
                      src={getGameCover(selectedGame)}
                      alt={selectedGame.gameName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_COVER;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white truncate text-sm">
                      {selectedGame.gameName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{getSnippet(selectedGame)}</span>
                      {selectedGame.isValidated && (
                        <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0" />
                      )}
                    </div>
                    {selectedGame.tournamentCount > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Trophy className="w-3 h-3 text-gray-500" />
                        <span className="text-[11px] text-gray-500">
                          {selectedGame.tournamentCount} {t('gaming.tournaments').replace(':', '')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onViewDetails(selectedGame.gameId)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: selectedTheme.colors.primary,
                    color: selectedTheme.colors.text,
                    boxShadow: `0 2px 12px ${selectedTheme.colors.primary}40`,
                  }}
                >
                  {t('gaming.viewDetails')}
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GameStatsCarousel;
