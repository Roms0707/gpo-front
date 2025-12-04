import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, TrendingUp, Target, Users, Clock } from 'lucide-react';

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
  otherParticipants: any[];
}

interface RiotPerformanceTipsProps {
  matches: RiotMatch[];
  rankedStats?: any;
}

const RiotPerformanceTips: React.FC<RiotPerformanceTipsProps> = ({ matches, rankedStats }) => {
  const { t } = useTranslation();
  const analyzePerformance = () => {
    if (matches.length === 0) return null;

    const recentMatches = matches.slice(0, 10);
    const totalMatches = recentMatches.length;
    
    // Calculate averages
    const avgKDA = recentMatches.reduce((sum, match) => {
      const kda = match.stats.deaths === 0 
        ? match.stats.kills + match.stats.assists 
        : (match.stats.kills + match.stats.assists) / match.stats.deaths;
      return sum + kda;
    }, 0) / totalMatches;

    const avgCS = recentMatches.reduce((sum, match) => sum + match.stats.creepScore, 0) / totalMatches;
    const winRate = (recentMatches.filter(match => match.stats.win).length / totalMatches) * 100;
    const avgGameDuration = recentMatches.reduce((sum, match) => sum + match.gameDuration, 0) / totalMatches;
    const csPerMinute = avgCS / (avgGameDuration / 60);

    return {
      avgKDA,
      avgCS,
      winRate,
      csPerMinute,
      avgGameDuration
    };
  };

  const generateTips = () => {
    const analysis = analyzePerformance();
    if (!analysis) return [];

    const tips = [];

    // KDA Tips
    if (analysis.avgKDA < 1.5) {
      tips.push({
        icon: <Target className="h-5 w-5 text-error-400" />,
        category: t('gaming.combat'),
        title: t('gaming.improveKDA'),
        description: t('gaming.kdaLowTip'),
        priority: 'high'
      });
    } else if (analysis.avgKDA > 3.0) {
      tips.push({
        icon: <Target className="h-5 w-5 text-success-400" />,
        category: t('gaming.combat'),
        title: t('gaming.excellentKDA'),
        description: t('gaming.kdaHighTip'),
        priority: 'positive'
      });
    }

    // CS Tips
    if (analysis.csPerMinute < 6) {
      tips.push({
        icon: <TrendingUp className="h-5 w-5 text-warning-400" />,
        category: t('gaming.farm'),
        title: t('gaming.improveFarming'),
        description: t('gaming.farmLowTip', { csPerMin: analysis.csPerMinute.toFixed(1) }),
        priority: 'medium'
      });
    } else if (analysis.csPerMinute > 8) {
      tips.push({
        icon: <TrendingUp className="h-5 w-5 text-success-400" />,
        category: t('gaming.farm'),
        title: t('gaming.excellentFarming'),
        description: t('gaming.farmHighTip', { csPerMin: analysis.csPerMinute.toFixed(1) }),
        priority: 'positive'
      });
    }

    // Win Rate Tips
    if (analysis.winRate < 50) {
      tips.push({
        icon: <Users className="h-5 w-5 text-error-400" />,
        category: t('gaming.strategy'),
        title: t('gaming.improveWinRate'),
        description: t('gaming.winRateLowTip', { winRate: analysis.winRate.toFixed(1) }),
        priority: 'high'
      });
    }

    // Game Duration Tips
    if (analysis.avgGameDuration > 2400) { // 40 minutes
      tips.push({
        icon: <Clock className="h-5 w-5 text-info-400" />,
        category: t('gaming.tempo'),
        title: t('gaming.speedUpGames'),
        description: t('gaming.longGamesTip'),
        priority: 'medium'
      });
    }

    // Ranked specific tips
    if (rankedStats) {
      const soloQueue = rankedStats.find((stat: any) => stat.queueType === 'RANKED_SOLO_5x5');
      if (soloQueue) {
        if (soloQueue.leaguePoints < 50 && soloQueue.rank !== 'I') {
          tips.push({
            icon: <TrendingUp className="h-5 w-5 text-primary-400" />,
            category: t('gaming.ranked'),
            title: t('gaming.rankedProgression'),
            description: t('gaming.lpProgressionTip', { lp: soloQueue.leaguePoints }),
            priority: 'medium'
          });
        }
      }
    }

    return tips;
  };

  const tips = generateTips();
  const analysis = analyzePerformance();

  return (
    <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center mb-6">
        <Lightbulb className="h-5 w-5 text-warning-500 mr-2" />
        <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-white">
          {t('gaming.performanceTips')}
        </h3>
      </div>

      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="text-lg font-bold text-primary-400">{analysis.avgKDA.toFixed(2)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.averageKDA')}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="text-lg font-bold text-warning-400">{analysis.csPerMinute.toFixed(1)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.csPerMin')}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="text-lg font-bold text-success-400">{analysis.winRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.winRate')}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
            <div className="text-lg font-bold text-info-400">{Math.floor(analysis.avgGameDuration / 60)}m</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('gaming.avgDuration')}</div>
          </div>
        </div>
      )}

      {tips.length > 0 ? (
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                tip.priority === 'high' ? 'border-error-500 bg-error-500/5' :
                tip.priority === 'medium' ? 'border-warning-500 bg-warning-500/5' :
                tip.priority === 'positive' ? 'border-success-500 bg-success-500/5' :
                'border-info-500 bg-info-500/5'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {tip.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {tip.category}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {tip.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('gaming.playForTips')}
          </p>
        </div>
      )}
    </div>
  );
};

export default RiotPerformanceTips;