import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Star, Gamepad2, Zap } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface StatsHighlightsRowProps {
  tournamentsPlayed: number;
  winRate: number;
  playerLevel: { level: number; title: string; progress: number };
  validatedAccounts: number;
  totalAccounts: number;
  bestElo: number;
  theme: GameTheme;
}

const StatsHighlightsRow: React.FC<StatsHighlightsRowProps> = ({
  tournamentsPlayed,
  winRate,
  playerLevel,
  validatedAccounts,
  totalAccounts,
  bestElo,
  theme,
}) => {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Trophy,
      value: tournamentsPlayed,
      label: t('gaming.tournamentsPlayed'),
    },
    {
      icon: TrendingUp,
      value: `${winRate}%`,
      label: t('gaming.winRate'),
    },
    {
      icon: Star,
      value: `${playerLevel.level}`,
      label: t('gaming.playerLevel'),
      sublabel: playerLevel.title,
    },
    {
      icon: Gamepad2,
      value: t('gaming.connectedAccountsCount', { validated: validatedAccounts, total: totalAccounts }),
      label: t('gaming.connectedAccounts'),
    },
    {
      icon: Zap,
      value: bestElo > 0 ? bestElo.toLocaleString() : '--',
      label: t('gaming.bestElo'),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.06, duration: 0.35 }}
            className="relative overflow-hidden rounded-xl p-4 backdrop-blur-sm group"
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.85)',
              border: `1px solid ${theme.colors.primary}20`,
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}12 0%, transparent 60%)`,
              }}
            />

            <div className="relative z-10 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.colors.primary}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-white truncate leading-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] text-gray-400 truncate leading-tight">
                  {stat.label}
                </div>
                {stat.sublabel && (
                  <div
                    className="text-[10px] font-medium truncate leading-tight"
                    style={{ color: theme.colors.primary }}
                  >
                    {stat.sublabel}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsHighlightsRow;
