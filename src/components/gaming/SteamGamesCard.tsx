import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

interface SteamGamesCardProps {
  games: {
    game_count: number;
    games: SteamGame[];
  };
}

const SteamGamesCard: React.FC<SteamGamesCardProps> = ({ games }) => {
  const { t } = useTranslation();
  const [showAllGames, setShowAllGames] = useState(false);

  const formatPlaytime = (minutes: number) => {
    if (minutes === 0) return '0h';
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}m`;
    if (hours < 100) return `${hours}h ${minutes % 60}m`;
    return `${hours}h`;
  };

  const getGameIconUrl = (game: SteamGame) => {
    if (game.img_icon_url) {
      return `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;
    }
    return null;
  };

  const displayedGames = showAllGames ? games.games : games.games.slice(0, 5);

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Gamepad2 className="h-5 w-5 text-primary-500 mr-2" />
          <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
            {t('gaming.gameLibrary')}
          </h3>
        </div>
        <span className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-sm font-medium">
          {games.game_count} {t('gaming.games')}
        </span>
      </div>

      {games.games.length > 0 ? (
        <div className="space-y-3">
          {displayedGames.map((game) => (
            <div key={game.appid} className="flex items-center p-3 bg-gray-50 dark:bg-dark-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors">
              <div className="w-10 h-10 rounded bg-gray-200 dark:bg-dark-300 overflow-hidden mr-3 flex-shrink-0">
                {getGameIconUrl(game) ? (
                  <img
                    src={getGameIconUrl(game)!}
                    alt={game.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {game.name}
                </h4>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatPlaytime(game.playtime_forever)}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-primary-400">
                  {formatPlaytime(game.playtime_forever)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('gaming.playtime')}
                </div>
              </div>
            </div>
          ))}

          {games.games.length > 5 && (
            <button
              onClick={() => setShowAllGames(!showAllGames)}
              className="w-full mt-3 flex items-center justify-center text-primary-500 hover:text-primary-400 transition-colors py-2"
            >
              {showAllGames ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  {t('gaming.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {t('gaming.showAllGames', { count: games.game_count })}
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{t('gaming.noGamesFound')}</p>
        </div>
      )}
    </div>
  );
};

export default SteamGamesCard;
