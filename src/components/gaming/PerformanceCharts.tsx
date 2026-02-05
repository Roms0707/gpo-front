import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { GameTheme, getCardClipPath, getCardBorderRadius } from '../../utils/gameThemes';

interface PerformanceData {
  game: number;
  score: number;
  average?: number;
}

interface PerformanceChartsProps {
  theme: GameTheme;
  recentScores: number[];
  winRate: number;
  averageScore: number;
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  theme,
  recentScores,
  winRate,
  averageScore
}) => {
  const { t } = useTranslation();
  const clipPath = getCardClipPath(theme.shape);
  const borderRadius = getCardBorderRadius(theme.shape);

  const chartData: PerformanceData[] = recentScores.slice(0, 10).reverse().map((score, index) => ({
    game: index + 1,
    score,
    average: averageScore
  }));

  const comparisonData = [
    { name: t('gaming.you'), value: winRate, fill: theme.colors.primary },
    { name: t('gaming.average'), value: 48, fill: 'rgba(255,255,255,0.3)' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-3 py-2 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'rgba(20, 20, 20, 0.95)',
            border: `1px solid ${theme.colors.primary}40`
          }}
        >
          <p className="text-xs text-gray-400 mb-1">{t('gaming.gameNumber', { number: label })}</p>
          <p className="text-sm font-bold" style={{ color: theme.colors.primary }}>
            {t('gaming.scoreValue', { score: payload[0]?.value?.toLocaleString() })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (recentScores.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      <div
        className="relative overflow-hidden p-5"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          clipPath: clipPath !== 'none' ? clipPath : undefined,
          borderRadius: clipPath === 'none' ? borderRadius : undefined,
          border: `1px solid ${theme.colors.primary}25`
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: theme.colors.primary }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: theme.colors.primary }} />
              {t('gaming.recentPerformance')}
            </h3>
            <span className="text-xs text-gray-500">
              {t('gaming.lastGames', { count: chartData.length })}
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${theme.colors.primary}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.colors.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="game"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={theme.colors.primary}
                  strokeWidth={2}
                  fill={`url(#gradient-${theme.colors.primary})`}
                  dot={{
                    fill: theme.colors.primary,
                    strokeWidth: 2,
                    r: 4,
                    stroke: 'rgba(30,30,30,1)'
                  }}
                  activeDot={{
                    r: 6,
                    fill: theme.colors.primary,
                    stroke: '#fff',
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden p-5"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          clipPath: clipPath !== 'none' ? clipPath : undefined,
          borderRadius: clipPath === 'none' ? borderRadius : undefined,
          border: `1px solid ${theme.colors.primary}25`
        }}
      >
        <div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: theme.colors.secondary }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: theme.colors.primary }} />
              {t('gaming.winRateComparison')}
            </h3>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical" barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.7)' }}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, t('gaming.winRate')]}
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    border: `1px solid ${theme.colors.primary}40`,
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                  itemStyle={{ color: theme.colors.primary }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 8, 8, 0]}
                  fill={theme.colors.primary}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <span className="text-gray-400">{t('gaming.yourWinRate')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              />
              <span className="text-gray-400">{t('gaming.platformAverage')}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceCharts;
