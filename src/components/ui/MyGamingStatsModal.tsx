import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Gamepad2, Trophy, TrendingUp, ExternalLink, Loader, Star, Award, User, TestTube, CheckCircle, XCircle, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserProfile, fetchTrackerGGProfile } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface MyGamingStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyGamingStatsModal: React.FC<MyGamingStatsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllGames, setShowAllGames] = useState(false);
  
  // Tracker.gg test state
  const [isTestingTrackerGG, setIsTestingTrackerGG] = useState(false);
  const [trackerGGTestResult, setTrackerGGTestResult] = useState<any | null>(null);
  const [trackerGGTestError, setTrackerGGTestError] = useState<string | null>(null);
  const [testPlayerName, setTestPlayerName] = useState('Ninja');

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isOpen || !user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchUserProfile(user.id);
        setUserProfile(data);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError(t('gaming.errorLoadingStats'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [isOpen, user?.id]);

  // Add/remove modal-open class to body
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  const handleTrackerGGTest = async () => {
    if (!testPlayerName.trim()) {
      toast.error(t('gaming.enterPlayerName'));
      return;
    }
    
    try {
      setIsTestingTrackerGG(true);
      setTrackerGGTestResult(null);
      setTrackerGGTestError(null);
      
      console.log('Testing Tracker.gg API for Fortnite...');
      
      const result = await fetchTrackerGGProfile(
        'ad0d9c5c-5d81-44e2-9a3f-8009e310bf53', // Fortnite game ID
        testPlayerName.trim(),
        'epic'
      );
      
      setTrackerGGTestResult(result);
      toast.success(t('gaming.trackerGGTestSuccess'));
      console.log('Tracker.gg test result:', result);
      
    } catch (error) {
      console.error('Tracker.gg test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setTrackerGGTestError(errorMessage);
      toast.error(t('gaming.trackerGGTestFailed', { error: errorMessage }));
    } finally {
      setIsTestingTrackerGG(false);
    }
  };

  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Group gaming accounts by game
  function groupAccountsByGame() {
    if (!userProfile || !userProfile.gaming_accounts) {
      return {};
    }
    
    return userProfile.gaming_accounts.reduce((acc: any, account: any) => {
      const gameName = account.game_publisher_ids.games.name;
      if (!acc[gameName]) {
        acc[gameName] = [];
      }
      acc[gameName].push(account);
      return acc;
    }, {});
  }

  return (
    <>
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col relative"
        style={{ position: 'relative', zIndex: 51 }}
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <Gamepad2 className="text-primary-500 h-6 w-6 mr-3" />
            <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
              {t('gaming.myGamingStats')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label={t('gaming.close')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader className="h-10 w-10 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('gaming.loadingYourStats')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Target className="h-12 w-12 text-error-500 mb-4" />
              <p className="text-error-600 dark:text-error-400 font-medium mb-2">{t('gaming.error')}</p>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          ) : userProfile ? (
            <div className="space-y-6">
              {/* Tournament Stats Overview */}
              <div>
                <h3 className="font-heading font-semibold text-lg mb-4 flex items-center text-gray-900 dark:text-white">
                  <Trophy className="h-5 w-5 text-warning-500 mr-2" />
                  {t('gaming.tournamentStatistics')}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary-400">
                      {userProfile.tournament_stats?.total || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.totalTournaments')}</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-warning-400">
                      {userProfile.tournament_stats?.upcoming || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.upcoming')}</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-error-400">
                      {userProfile.tournament_stats?.ongoing || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.ongoing')}</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-success-400">
                      {userProfile.tournament_stats?.completed || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('gaming.completed')}</div>
                  </div>
                </div>
              </div>

              {/* Game Rankings */}
              {userProfile.game_rankings && userProfile.game_rankings.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-4 flex items-center text-gray-900 dark:text-white">
                    <Award className="h-5 w-5 text-primary-500 mr-2" />
                    {t('gaming.gameRankings')}
                  </h3>
                  
                  <div className="space-y-4">
                    {userProfile.game_rankings.slice(0, showAllGames ? undefined : 3).map((ranking: any, index: number) => {
                      return (
                        <div key={index} className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-primary-600/10 dark:bg-primary-600/20 p-2 rounded-lg mr-3">
                                <Gamepad2 className="h-5 w-5 text-primary-500" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {ranking.game_name || t('gaming.unknownGame')}
                                </h4>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Star className="h-4 w-4 text-warning-500 mr-1" />
                                  <span>{ranking.rank ? t('gaming.rankNumber', { rank: ranking.rank }) : 'N/A'}</span>
                                  {ranking.tier && (
                                    <span className="ml-2 px-2 py-1 bg-primary-600/10 text-primary-600 dark:text-primary-400 rounded text-xs">
                                      {ranking.tier}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center bg-primary-600/10 dark:bg-primary-600/20 px-3 py-2 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-primary-500 mr-2" />
                              <div className="text-right">
                                <div className="font-bold text-2xl text-primary-400">{ranking.elo_rating}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('gaming.eloRating')}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {userProfile.game_rankings.length > 3 && (
                      <div className="text-center">
                        <button
                          onClick={() => setShowAllGames(!showAllGames)}
                          className="text-primary-500 hover:text-primary-400 text-sm transition-colors"
                        >
                          {showAllGames
                            ? t('gaming.showLess')
                            : t('gaming.showMoreGames', { count: userProfile.game_rankings.length - 3 })
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!userProfile.game_rankings || userProfile.game_rankings.length === 0) && 
               (!userProfile.gaming_accounts || userProfile.gaming_accounts.filter((account: any) => {
                 const isRiotAccount = account.game_publisher_ids?.games?.name === 'League of Legends';
                 return isRiotAccount && account.is_validated && account.validation_data;
               }).length === 0) && (
                <div className="text-center py-8">
                  <Gamepad2 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{t('gaming.noStatsAvailableYet')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t('gaming.participateToSeeStats')}
                  </p>
                  <Link
                    to="/profile/gaming-stats"
                    onClick={onClose}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                  >
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    {t('gaming.viewMyFullStats')}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <User className="h-16 w-16 text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('gaming.noInformationAvailable')}</p>
            </div>
          )}
        </div>
        
        {/* Footer - Only show when there are stats */}
        {((userProfile?.game_rankings && userProfile.game_rankings.length > 0) || 
          (userProfile?.gaming_accounts && userProfile.gaming_accounts.filter((account: any) => {
            const isRiotAccount = account.game_publisher_ids?.games?.name === 'League of Legends';
            return isRiotAccount && account.is_validated && account.validation_data;
          }).length > 0)) && (
          <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('gaming.statsUpdatedRealtime')}
              </div>
              <Link
                to="/profile/gaming-stats"
                onClick={onClose}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('gaming.viewAllMyStats')}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};


export default MyGamingStatsModal;