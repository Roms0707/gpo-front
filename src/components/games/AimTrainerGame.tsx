import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, RotateCcw, Trophy, Clock, Crosshair, TrendingUp, Medal, User, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AimTrainerGameProps {
  gameName: string;
}

interface LeaderboardEntry {
  id: string;
  score: number;
  created_at: string;
  users: {
    username: string;
    avatar_url: string | null;
  };
}

const AimTrainerGame: React.FC<AimTrainerGameProps> = ({ gameName }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTipsOverlay, setShowTipsOverlay] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPersonalStats, setShowPersonalStats] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [personalHistory, setPersonalHistory] = useState<LeaderboardEntry[]>([]);
  const [isLoadingPersonalStats, setIsLoadingPersonalStats] = useState(false);
  const [personalStats, setPersonalStats] = useState({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    totalScore: 0,
    improvement: 0
  });
  const [gameStats, setGameStats] = useState({
    lastScore: 0,
    lastAccuracy: 0,
    bestScore: 0,
    gamesPlayed: 0
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to send translations to iframe
  const sendTranslationsToIframe = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const translations = {
        score: t('gaming.aimTrainerGame.score'),
        accuracy: t('gaming.aimTrainerGame.accuracy'),
        time: t('gaming.aimTrainerGame.time'),
        combo: t('gaming.aimTrainerGame.combo'),
        startTitle: t('gaming.aimTrainerGame.startTitle'),
        startDescription: t('gaming.aimTrainerGame.startDescription'),
        startDescription2: t('gaming.aimTrainerGame.startDescription2'),
        startButton: t('gaming.aimTrainerGame.startButton'),
        endTitle: t('gaming.aimTrainerGame.endTitle'),
        finalScore: t('gaming.aimTrainerGame.finalScore'),
        finalAccuracy: t('gaming.aimTrainerGame.finalAccuracy'),
        bestCombo: t('gaming.aimTrainerGame.bestCombo'),
        targetsHit: t('gaming.aimTrainerGame.targetsHit'),
        replayButton: t('gaming.aimTrainerGame.replayButton'),
        closeButton: t('gaming.aimTrainerGame.closeButton'),
        missEffect: t('gaming.aimTrainerGame.missEffect'),
        seconds: t('gaming.aimTrainerGame.seconds')
      };

      console.log('Parent: Sending translations to iframe', translations);
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_TRANSLATIONS',
        translations: translations
      }, '*');
    }
  }, [t]);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Parent: Language changed, sending new translations');
      sendTranslationsToIframe();
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, sendTranslationsToIframe]);

  useEffect(() => {
    // Load saved stats from localStorage
    const savedStats = localStorage.getItem(`aimTrainer_${gameName}`);
    if (savedStats) {
      setGameStats(JSON.parse(savedStats));
    }
    
    // Load leaderboard on component mount
    loadLeaderboard();
    
    // Load personal stats if user is logged in
    if (user?.id) {
      loadPersonalStats();
    }
    
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      console.log('Parent: Received message from iframe:', event.data);

      if (event.data && event.data.source === 'aimTrainer') {
        if (event.data.type === 'IFRAME_READY') {
          console.log('Parent: Iframe ready, sending translations');
          sendTranslationsToIframe();
        } else if (event.data.type === 'gameStarted') {
          console.log('Parent: Game started, hiding tips overlay');
          setShowTipsOverlay(false);
        } else if (event.data.type === 'gameEnded') {
          console.log('Parent: Game ended, processing stats');
          if (event.data.stats) {
            handleGameComplete(event.data.stats.score, event.data.stats.accuracy);
          }
        } else if (event.data.type === 'TRANSLATIONS_RECEIVED') {
          console.log('Parent: Iframe confirmed receipt of translations');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [gameName, user?.id, sendTranslationsToIframe]);

  const loadLeaderboard = async () => {
    try {
      setIsLoadingLeaderboard(true);
      
      const { data, error } = await supabase
        .from('aim_trainer_scores')
        .select(`
          id,
          score,
          created_at,
          users:user_id (
            username,
            avatar_url
          )
        `)
        .order('score', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }
      
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const loadPersonalStats = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingPersonalStats(true);
      
      // Get user's score history
      const { data: historyData, error: historyError } = await supabase
        .from('aim_trainer_scores')
        .select(`
          id,
          score,
          created_at,
          users:user_id (
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (historyError) {
        console.error('Error loading personal history:', historyError);
        return;
      }
      
      setPersonalHistory(historyData || []);
      
      // Calculate personal statistics
      if (historyData && historyData.length > 0) {
        const scores = historyData.map(entry => entry.score);
        const totalGames = scores.length;
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const averageScore = Math.round(totalScore / totalGames);
        const bestScore = Math.max(...scores);
        
        // Calculate improvement (compare last 5 games vs previous 5 games)
        let improvement = 0;
        if (totalGames >= 10) {
          const recent5 = scores.slice(0, 5);
          const previous5 = scores.slice(5, 10);
          const recentAvg = recent5.reduce((sum, score) => sum + score, 0) / 5;
          const previousAvg = previous5.reduce((sum, score) => sum + score, 0) / 5;
          improvement = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
        }
        
        setPersonalStats({
          totalGames,
          averageScore,
          bestScore,
          totalScore,
          improvement
        });
      }
    } catch (error) {
      console.error('Error loading personal stats:', error);
    } finally {
      setIsLoadingPersonalStats(false);
    }
  };
  const handleFullscreen = () => {
    if (!isFullscreen && iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleGameComplete = (score: number, accuracy: number) => {
    const newStats = {
      lastScore: score,
      lastAccuracy: accuracy,
      bestScore: Math.max(gameStats.bestScore, score),
      gamesPlayed: gameStats.gamesPlayed + 1
    };
    
    setGameStats(newStats);
    localStorage.setItem(`aimTrainer_${gameName}`, JSON.stringify(newStats));
    
    // Save score to database only if user is logged in
    if (user?.id && score > 0) {
      saveScoreToDatabase(score).then(() => {
        // Reload leaderboard and personal stats after saving score
        loadLeaderboard();
        loadPersonalStats();
      }).catch(error => {
        console.error('Error saving score to database:', error);
        // Don't show error to user, just log it
      });
    } else if (!user?.id) {
      // For non-authenticated users, just reload the leaderboard
      loadLeaderboard();
    }
  };
  
  const saveScoreToDatabase = async (score: number) => {
    try {
      const { error } = await supabase
        .from('aim_trainer_scores')
        .insert([
          {
            user_id: user!.id,
            score: score
          }
        ]);
      
      if (error) {
        console.error('Error saving aim trainer score:', error);
        // Don't show error toast to avoid disrupting the game experience
        return;
      }
      
      console.log('Aim trainer score saved successfully:', score);
    } catch (error) {
      console.error('Error saving aim trainer score:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return t('gaming.daysAgo', { count: diffDays });
    } else if (diffHours > 0) {
      return t('gaming.hoursAgo', { count: diffHours });
    } else if (diffMinutes > 0) {
      return t('gaming.minutesAgo', { count: diffMinutes });
    } else {
      return t('gaming.justNow');
    }
  };

  const resetStats = () => {
    const resetStats = {
      lastScore: 0,
      lastAccuracy: 0,
      bestScore: 0,
      gamesPlayed: 0
    };
    setGameStats(resetStats);
    localStorage.removeItem(`aimTrainer_${gameName}`);
  };

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
              <Target className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
                🎯 {t('gaming.aimTrainer')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('gaming.improveYourAimFor', { game: gameName })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFullscreen}
              className="bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-colors"
              title={t('gaming.fullscreen')}
            >
              <Crosshair className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-colors"
              title={t('gaming.toggleLeaderboard')}
            >
              <Trophy className="h-4 w-4" />
            </button>
            
            {user && (
              <button
                onClick={() => setShowPersonalStats(!showPersonalStats)}
                className="bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-colors"
                title={t('gaming.togglePersonalStats')}
              >
                <TrendingUp className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={resetStats}
              className="bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-colors"
              title={t('gaming.resetStats')}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {gameStats.gamesPlayed > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-dark-200/50 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">{gameStats.lastScore}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.lastScore')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{gameStats.lastAccuracy}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.lastAccuracy')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{gameStats.bestScore}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.bestScore')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-500">{gameStats.gamesPlayed}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.gamesPlayed')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Statistics */}
      {showPersonalStats && user && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading font-semibold text-lg flex items-center text-gray-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              {t('gaming.yourStatistics')}
            </h4>
            <button
              onClick={loadPersonalStats}
              disabled={isLoadingPersonalStats}
              className="text-blue-500 hover:text-blue-400 text-sm transition-colors"
            >
              {isLoadingPersonalStats ? t('gaming.loading') : t('gaming.refresh')}
            </button>
          </div>
          
          {isLoadingPersonalStats ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{t('gaming.loadingYourStats')}</span>
            </div>
          ) : personalHistory.length > 0 ? (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-white dark:bg-dark-200 rounded-lg">
                  <div className="text-xl font-bold text-blue-500">{personalStats.totalGames}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.totalGames')}</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-dark-200 rounded-lg">
                  <div className="text-xl font-bold text-green-500">{personalStats.averageScore}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.averageScore')}</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-dark-200 rounded-lg">
                  <div className="text-xl font-bold text-yellow-500">{personalStats.bestScore}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.bestScore')}</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-dark-200 rounded-lg">
                  <div className="text-xl font-bold text-purple-500">{personalStats.totalScore.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.totalScore')}</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-dark-200 rounded-lg">
                  <div className={`text-xl font-bold ${
                    personalStats.improvement > 0 ? 'text-green-500' : 
                    personalStats.improvement < 0 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {personalStats.improvement > 0 ? '+' : ''}{personalStats.improvement}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('gaming.improvement')}</div>
                </div>
              </div>
              
              {/* Score History */}
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">{t('gaming.recentScores')}</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {personalHistory.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        entry.score === personalStats.bestScore 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' 
                          : 'bg-white dark:bg-dark-200 hover:bg-gray-50 dark:hover:bg-dark-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center mr-3">
                          {entry.score === personalStats.bestScore ? (
                            <Crown className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <span className="font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                          )}
                        </div>
                        
                        <div>
                          <div className={`font-medium ${
                            entry.score === personalStats.bestScore 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {entry.score.toLocaleString()} {t('gaming.points')}
                            {entry.score === personalStats.bestScore && (
                              <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                {t('gaming.personalBest')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(entry.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {t('gaming.game', { number: personalHistory.length - index })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('gaming.noPersonalStatsYet')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {t('gaming.playSomeGamesToSeeStats')}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Login prompt for non-authenticated users */}
      {!user?.id && (
        <div className="p-4 bg-info-50 dark:bg-info-900/20 border-b border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-info-700 dark:text-info-300 text-sm mb-3">
              <strong>💡 {t('gaming.loginTip')}</strong> {t('gaming.loginToSaveScores')}
            </p>
            <a
              href="/login"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center"
            >
              <User className="h-4 w-4 mr-2" />
              {t('gaming.login')}
            </a>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="p-4 bg-gray-50 dark:bg-dark-200/50 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading font-semibold text-lg flex items-center text-gray-900 dark:text-white">
              <Trophy className="h-5 w-5 text-warning-500 mr-2" />
              {t('gaming.topScores')}
            </h4>
            <button
              onClick={loadLeaderboard}
              disabled={isLoadingLeaderboard}
              className="text-primary-500 hover:text-primary-400 text-sm transition-colors"
            >
              {isLoadingLeaderboard ? t('gaming.loading') : t('gaming.refresh')}
            </button>
          </div>
          
          {isLoadingLeaderboard ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{t('gaming.loadingLeaderboard')}</span>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                    index === 2 ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/20 border border-amber-700/30' :
                    'bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-400'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      {index === 0 ? (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="h-5 w-5 text-gray-400" />
                      ) : index === 2 ? (
                        <Medal className="h-5 w-5 text-amber-700" />
                      ) : (
                        <span className="font-bold text-gray-500 dark:text-gray-400">#{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-300 overflow-hidden mr-3 flex items-center justify-center">
                      {entry.users.avatar_url ? (
                        <img 
                          src={entry.users.avatar_url} 
                          alt={entry.users.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <div>
                      <div className={`font-medium ${
                        index === 0 ? 'text-yellow-600 dark:text-yellow-400' :
                        index === 1 ? 'text-gray-600 dark:text-gray-300' :
                        index === 2 ? 'text-amber-700 dark:text-amber-600' :
                        'text-gray-900 dark:text-white'
                      }`}>
                        {entry.users.username}
                        {user?.id === entry.user_id && (
                          <span className="ml-2 text-xs bg-primary-600/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                            {t('gaming.you')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(entry.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-600 dark:text-yellow-400' :
                      index === 1 ? 'text-gray-600 dark:text-gray-300' :
                      index === 2 ? 'text-amber-700 dark:text-amber-600' :
                      'text-gray-900 dark:text-white'
                    }`}>
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.points')}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('gaming.noScoresYet')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {t('gaming.beTheFirstToSetHighScore')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Game Container */}
      <div className="relative">
        <iframe
          ref={iframeRef}
          src="/aim-trainer-game/index.html"
          className="w-full h-[500px] border-0"
          title="Aim Trainer Game"
          allow="fullscreen"
        />
        
        {/* Overlay Instructions */}
        {showTipsOverlay && (
         console.log('Parent: Rendering tips overlay, showTipsOverlay =', showTipsOverlay),
          <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm max-w-xs transition-opacity duration-300">
            <div className="flex items-center mb-2">
              <Target className="h-4 w-4 mr-2 text-red-400" />
              <span className="font-medium">{t('gaming.quickTips')}</span>
            </div>
            <ul className="text-xs space-y-1">
              <li>• {t('gaming.tipClickTargets')}</li>
              <li>• {t('gaming.tipTimeLimit')}</li>
              <li>• {t('gaming.tipFasterClicks')}</li>
              <li>• {t('gaming.tipPracticeDaily')}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AimTrainerGame;