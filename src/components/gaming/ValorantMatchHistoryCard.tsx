import React, { useState } from 'react';
import { Clock, Trophy, Target, Users, ChevronDown, ChevronUp, Sword, Shield, MapPin } from 'lucide-react';
import { ValorantMatch } from '../../types';

interface ValorantMatchHistoryCardProps {
  matches: ValorantMatch[];
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// Helper to get Valorant agent icon (placeholder for now)
const getValorantAgentIcon = (agentId: string) => {
  // In a real app, you'd map agentId to an image URL
  // Example: `https://media.valorant-api.com/agents/${agentId}/displayicon.png`
  return `https://valorant-api.com/images/agents/${agentId}/displayicon.png`;
};

const ValorantMatchHistoryCard: React.FC<ValorantMatchHistoryCardProps> = ({
  matches,
  isLoading,
  onLoadMore,
  hasMore = false
}) => {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const toggleMatchDetails = (matchId: string) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  const formatGameDuration = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (millis: number): string => {
    const now = Date.now();
    const diffMs = now - millis;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (isLoading && matches.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement de l'historique...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-5 w-5 text-red-500 mr-2" />
          Historique des matchs Valorant
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {matches.length} matchs récents
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match) => {
            const isExpanded = expandedMatch === match.matchId;
            
            return (
              <div 
                key={match.matchId}
                className={`border rounded-lg transition-all duration-200 ${
                  match.stats.won 
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
                      {/* Agent Icon */}
                      <div className="relative">
                        <img 
                          src={getValorantAgentIcon(match.agent.id)}
                          alt={match.agent.name}
                          className="w-12 h-12 rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://valorant-api.com/images/agents/5f8d3a7f-467b-979f-0031-af865786534b/displayicon.png'; // Default agent icon
                          }}
                        />
                      </div>

                      {/* Match Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${match.stats.won ? 'text-success-400' : 'text-error-400'}`}>
                            {match.stats.won ? 'VICTOIRE' : 'DÉFAITE'}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {match.gameMode}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(match.gameStartMillis)} • {formatGameDuration(match.gameLengthMillis)}
                        </div>
                      </div>
                    </div>

                    {/* KDA and Score */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {match.stats.kills}/{match.stats.deaths}/{match.stats.assists}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          KDA
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {match.stats.score}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                      </div>

                      <div className="text-center">
                        <div className="font-bold text-warning-400">
                          {match.stats.roundsPlayed}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Rounds</div>
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
                      {/* Map and Rounds */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Détails du match</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>Map: {match.mapName}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Durée: {formatGameDuration(match.gameLengthMillis)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Trophy className="h-4 w-4 mr-2" />
                            <span>Rounds joués: {match.stats.roundsPlayed}</span>
                          </div>
                        </div>
                      </div>

                      {/* Teammates */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Coéquipiers</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {match.teammates.map((teammate, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={getValorantAgentIcon(teammate.agent)} 
                                  alt={teammate.agent} 
                                  className="w-6 h-6 rounded-full"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://valorant-api.com/images/agents/5f8d3a7f-467b-979f-0031-af865786534b/displayicon.png';
                                  }}
                                />
                                <span className="text-gray-700 dark:text-gray-300 truncate max-w-24">
                                  {teammate.gameName}#{teammate.tagLine}
                                </span>
                              </div>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">
                                {teammate.kills}/{teammate.deaths}/{teammate.assists}
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
                {isLoading ? 'Chargement...' : 'Charger plus de matchs'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Aucun match trouvé</p>
        </div>
      )}
    </div>
  );
};

export default ValorantMatchHistoryCard;