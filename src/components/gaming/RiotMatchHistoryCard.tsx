import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Trophy, Target, Users, ChevronDown, ChevronUp, Sword, Shield } from 'lucide-react';
import { getChampionIconUrl, getSummonerSpellIconUrl, getItemIconUrl, calculateKDAR, formatGameDuration, formatTimeAgo, getQueueTypeDisplayName } from '../../utils/riotDataDragon';

interface RiotMatch {
  matchId: string;
  gameMode: string;
  gameDuration: number;
  gameCreation: number;
  champion: {
    name: string;
    id: number;
  };
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
    totalDamageDealt: number;
    goldEarned: number;
    creepScore: number;
    champLevel: number;
  };
  items: number[];
  summoners: number[];
  otherParticipants: {
    championName: string;
    summonerName: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
  }[];
}

interface RiotMatchHistoryCardProps {
  matches: RiotMatch[];
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const RiotMatchHistoryCard: React.FC<RiotMatchHistoryCardProps> = ({
  matches,
  isLoading,
  onLoadMore,
  hasMore = false
}) => {
  const { t } = useTranslation();
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const toggleMatchDetails = (matchId: string) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  if (isLoading && matches.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">{t('gaming.loadingHistory')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-5 w-5 text-primary-500 mr-2" />
          {t('gaming.matchHistory')}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {matches.length} {t('gaming.recentMatches')}
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match) => {
            const kda = calculateKDAR(match.stats.kills, match.stats.deaths, match.stats.assists);
            const isExpanded = expandedMatch === match.matchId;
            
            return (
              <div 
                key={match.matchId}
                className={`border rounded-lg transition-all duration-200 ${
                  match.stats.win 
                    ? 'border-success-500/30 bg-success-500/5' 
                    : 'border-error-500/30 bg-error-500/5'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-200/50 transition-colors"
                  onClick={() => toggleMatchDetails(match.matchId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Champion Icon */}
                      <div className="relative">
                        <img 
                          src={getChampionIconUrl(match.champion.name)}
                          alt={match.champion.name}
                          className="w-12 h-12 rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Aatrox.png';
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-dark-100 rounded-full px-1 text-xs font-bold text-white">
                          {match.stats.champLevel}
                        </div>
                      </div>

                      {/* Match Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${match.stats.win ? 'text-success-400' : 'text-error-400'}`}>
                            {match.stats.win ? t('gaming.victory') : t('gaming.defeat')}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getQueueTypeDisplayName(match.gameMode)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(match.gameCreation)} • {formatGameDuration(match.gameDuration)}
                        </div>
                      </div>
                    </div>

                    {/* KDA and Stats */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {match.stats.kills}/{match.stats.deaths}/{match.stats.assists}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {kda.toFixed(2)} KDA
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {match.stats.creepScore}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">CS</div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-warning-400">
                          {(match.stats.goldEarned / 1000).toFixed(1)}k
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Gold</div>
                      </div>

                      <ChevronDown 
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-dark-200/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Items and Summoners */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">{t('gaming.itemsAndSpells')}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{t('gaming.items')}</span>
                            <div className="flex space-x-1">
                              {match.items.map((itemId, index) => (
                                <img 
                                  key={index}
                                  src={getItemIconUrl(itemId)}
                                  alt={`Item ${itemId}`}
                                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{t('gaming.spells')}</span>
                            <div className="flex space-x-1">
                              {match.summoners.map((summonerId, index) => (
                                <img 
                                  key={index}
                                  src={getSummonerSpellIconUrl(summonerId)}
                                  alt={`Summoner ${summonerId}`}
                                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Other Players */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">{t('gaming.otherPlayers')}</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {match.otherParticipants.slice(0, 5).map((participant, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  participant.win ? 'bg-success-400' : 'bg-error-400'
                                }`}></span>
                                <span className="text-gray-700 dark:text-gray-300 truncate max-w-24">
                                  {participant.summonerName}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                  {participant.championName}
                                </span>
                              </div>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">
                                {participant.kills}/{participant.deaths}/{participant.assists}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isLoading ? t('gaming.loading') : t('gaming.loadMoreMatches')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('gaming.noMatchesFound')}</p>
        </div>
      )}
    </div>
  );
};

export default RiotMatchHistoryCard;