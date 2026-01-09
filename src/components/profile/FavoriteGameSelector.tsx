import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Game } from '../../types';
import { getGameTheme, GameTheme } from '../../utils/gameThemes';

interface FavoriteGameSelectorProps {
  games: Game[];
  selectedGameId: string | null;
  onSelect: (gameId: string | null) => void;
  isLoading?: boolean;
  variant?: 'carousel' | 'grid';
  showLabel?: boolean;
  showColorPreview?: boolean;
}

const FavoriteGameSelector: React.FC<FavoriteGameSelectorProps> = ({
  games,
  selectedGameId,
  onSelect,
  isLoading = false,
  variant = 'carousel',
  showLabel = true,
  showColorPreview = false
}) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const selectedGame = games.find(g => g.id === selectedGameId);
  const theme: GameTheme = getGameTheme(selectedGame?.name || null);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (variant === 'carousel') {
      checkScrollButtons();
      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener('scroll', checkScrollButtons);
        window.addEventListener('resize', checkScrollButtons);
      }
      return () => {
        if (container) {
          container.removeEventListener('scroll', checkScrollButtons);
        }
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [games, variant]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    if (variant === 'grid') {
      return (
        <div className="space-y-3">
          {showLabel && (
            <label className="block text-sm font-medium text-gray-300">
              {t('profile.selectYourFavoriteGame')}
            </label>
          )}
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-lg bg-dark-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.favoriteGame')}
          </label>
        )}
        <div className="flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 h-40 rounded-xl bg-gray-200 dark:bg-dark-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="space-y-3">
        {showLabel && (
          <label className="block text-sm font-medium text-gray-300">
            {t('profile.selectYourFavoriteGame')}
          </label>
        )}

        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <GridAutoDetectCard
            isSelected={selectedGameId === null}
            onSelect={() => onSelect(null)}
          />

          {games.map((game) => (
            <GridGameCard
              key={game.id}
              game={game}
              isSelected={selectedGameId === game.id}
              onSelect={() => onSelect(game.id)}
            />
          ))}
        </div>

        {showColorPreview && selectedGame && (
          <div className="pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-500 mb-2">{t('profile.themeColors')}</p>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg shadow-inner"
                style={{ backgroundColor: theme.colors.primary }}
                title="Primary"
              />
              <div
                className="w-8 h-8 rounded-lg shadow-inner"
                style={{ backgroundColor: theme.colors.secondary }}
                title="Secondary"
              />
              <span className="text-xs text-gray-400 ml-2">{selectedGame.name}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showLabel && (
        <>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.favoriteGame')}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t('profile.favoriteGameDescription')}
          </p>
        </>
      )}

      <div className="relative group">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-dark-100 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-200 transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-dark-100 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-200 transition-all opacity-0 group-hover:opacity-100 translate-x-1/2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <AutoDetectCard
            isSelected={selectedGameId === null}
            onSelect={() => onSelect(null)}
          />

          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={selectedGameId === game.id}
              onSelect={() => onSelect(game.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface AutoDetectCardProps {
  isSelected: boolean;
  onSelect: () => void;
}

const AutoDetectCard: React.FC<AutoDetectCardProps> = ({ isSelected, onSelect }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        flex-shrink-0 w-28 rounded-xl overflow-hidden transition-all duration-300
        border-2 relative group/card
        ${isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/30 scale-[1.02]'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:scale-[1.01]'
        }
      `}
    >
      <div className="aspect-[3/4] relative bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-primary-500/20 dark:from-primary-500/30 dark:via-secondary-500/30 dark:to-primary-500/30 flex flex-col items-center justify-center p-3">
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all
          ${isSelected
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40'
            : 'bg-white/80 dark:bg-dark-200/80 text-primary-500'
          }
        `}>
          <Sparkles className="w-7 h-7" />
        </div>

        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-200 leading-tight">
          {t('profile.autoDetect')}
        </span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-1 leading-tight">
          {t('profile.basedOnActivity')}
        </span>

        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>
    </button>
  );
};

const GridAutoDetectCard: React.FC<AutoDetectCardProps> = ({ isSelected, onSelect }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        aspect-[3/4] rounded-lg overflow-hidden transition-all duration-200
        border-2 relative group/card
        ${isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/30'
          : 'border-gray-700 hover:border-primary-400'
        }
      `}
    >
      <div className="w-full h-full relative bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-primary-500/20 flex flex-col items-center justify-center p-2">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all
          ${isSelected
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40'
            : 'bg-dark-200/80 text-primary-500'
          }
        `}>
          <Sparkles className="w-4 h-4" />
        </div>

        <span className="text-[10px] font-medium text-center text-gray-200 leading-tight">
          {t('profile.autoDetect')}
        </span>

        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md">
            <Check className="w-2.5 h-2.5" />
          </div>
        )}
      </div>
    </button>
  );
};

interface GameCardProps {
  game: Game;
  isSelected: boolean;
  onSelect: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, isSelected, onSelect }) => {
  const theme = getGameTheme(game.name);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        flex-shrink-0 w-28 rounded-xl overflow-hidden transition-all duration-300
        border-2 relative group/card
        ${isSelected
          ? 'scale-[1.02]'
          : 'border-gray-200 dark:border-gray-700 hover:scale-[1.01]'
        }
      `}
      style={{
        borderColor: isSelected ? theme.colors.primary : undefined,
        boxShadow: isSelected ? `0 0 20px ${theme.colors.glow}` : undefined
      }}
    >
      <div className="aspect-[3/4] relative bg-gray-100 dark:bg-dark-200">
        {game.image_url ? (
          <img
            src={game.image_url}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <span className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
              {game.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-8">
          <span className="text-xs font-medium text-white line-clamp-2 leading-tight">
            {game.name}
          </span>
        </div>

        {isSelected && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full text-white flex items-center justify-center shadow-md"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Check className="w-3 h-3" />
          </div>
        )}

        <div
          className={`
            absolute inset-0 transition-opacity duration-300 pointer-events-none
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-50'}
          `}
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}10 0%, transparent 50%, ${theme.colors.secondary}10 100%)`
          }}
        />
      </div>
    </button>
  );
};

const GridGameCard: React.FC<GameCardProps> = ({ game, isSelected, onSelect }) => {
  const theme = getGameTheme(game.name);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        aspect-[3/4] rounded-lg overflow-hidden transition-all duration-200
        border-2 relative group/card
        ${isSelected ? '' : 'border-gray-700 hover:border-gray-600'}
      `}
      style={{
        borderColor: isSelected ? theme.colors.primary : undefined,
        boxShadow: isSelected ? `0 0 15px ${theme.colors.glow}` : undefined
      }}
    >
      <div className="w-full h-full relative bg-dark-200">
        {game.image_url ? (
          <img
            src={game.image_url}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <span className="text-xl font-bold" style={{ color: theme.colors.primary }}>
              {game.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1.5 pt-6">
          <span className="text-[9px] font-medium text-white line-clamp-2 leading-tight">
            {game.name}
          </span>
        </div>

        {isSelected && (
          <div
            className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-md"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Check className="w-2.5 h-2.5" />
          </div>
        )}

        <div
          className={`
            absolute inset-0 transition-opacity duration-200 pointer-events-none
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-50'}
          `}
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, transparent 50%, ${theme.colors.secondary}15 100%)`
          }}
        />
      </div>
    </button>
  );
};

export default FavoriteGameSelector;
