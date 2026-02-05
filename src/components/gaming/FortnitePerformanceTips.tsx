import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, TrendingUp, Shield, Zap, Award, Users } from 'lucide-react';
import { getGameTheme, getCardClipPath } from '../../utils/gameThemes';

interface FortnitePerformanceTipsProps {
  stats?: any;
}

const FortnitePerformanceTips: React.FC<FortnitePerformanceTipsProps> = ({ stats }) => {
  const { t } = useTranslation();
  const theme = getGameTheme('Fortnite');
  const getTips = () => {
    const tips = [];

    if (stats) {
      const totalWins = stats.wins || 0;
      const totalMatches = stats.matches || 0;
      const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

      if (winRate < 5) {
        tips.push({
          icon: Target,
          title: t('gaming.tips.improveWinRate'),
          description: t('gaming.tips.improveWinRateDesc'),
          color: theme.colors.primary
        });
      }

      const kills = stats.kills || 0;
      const deaths = stats.deaths || 1;
      const kd = kills / deaths;

      if (kd < 1) {
        tips.push({
          icon: Zap,
          title: t('gaming.tips.improveKD'),
          description: t('gaming.tips.improveKDDesc'),
          color: theme.colors.secondary
        });
      }

      tips.push({
        icon: Shield,
        title: t('gaming.tips.masterBuilding'),
        description: t('gaming.tips.masterBuildingDesc'),
        color: theme.colors.border
      });
    }

    const generalTips = [
      {
        icon: TrendingUp,
        title: t('gaming.tips.resourceManagement'),
        description: t('gaming.tips.resourceManagementDesc'),
        color: '#22C55E'
      },
      {
        icon: Award,
        title: t('gaming.tips.positioning'),
        description: t('gaming.tips.positioningDesc'),
        color: theme.colors.primary
      },
      {
        icon: Users,
        title: t('gaming.tips.teamplay'),
        description: t('gaming.tips.teamplayDesc'),
        color: theme.colors.secondary
      }
    ];

    return [...tips, ...generalTips].slice(0, 4);
  };

  const tips = getTips();

  return (
    <div
      className="bg-white dark:bg-gray-800/90 shadow-lg p-6 relative overflow-hidden"
      style={{
        clipPath: getCardClipPath(theme.shape),
        border: `1px solid ${theme.colors.border}30`,
      }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${theme.colors.primary}20, transparent 50%, ${theme.colors.border}20)` }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Target className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('gaming.fortnitePerformanceTips')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => {
            const IconComponent = tip.icon;
            return (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: tip.color }} />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {tip.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-6 p-4 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.border}15)`,
            border: `1px solid ${theme.colors.primary}30`,
          }}
        >
          <p className="text-sm" style={{ color: theme.colors.border }}>
            <strong>{t('gaming.tips.tipLabel')}</strong> {t('gaming.tips.watchReplays')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FortnitePerformanceTips;