import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { GameTheme, getCardClipPath, getCardBorderRadius } from '../../utils/gameThemes';

interface ThemedStatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  theme: GameTheme;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const ThemedStatCard: React.FC<ThemedStatCardProps> = ({
  icon: Icon,
  value,
  label,
  theme,
  subValue,
  trend,
  trendValue,
  delay = 0,
  size = 'md',
  onClick
}) => {
  const clipPath = getCardClipPath(theme.shape);
  const borderRadius = getCardBorderRadius(theme.shape);

  const sizeStyles = {
    sm: {
      padding: 'p-4',
      iconContainer: 'w-10 h-10',
      iconSize: 'w-5 h-5',
      valueSize: 'text-xl',
      labelSize: 'text-xs'
    },
    md: {
      padding: 'p-5',
      iconContainer: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      valueSize: 'text-2xl',
      labelSize: 'text-sm'
    },
    lg: {
      padding: 'p-6',
      iconContainer: 'w-14 h-14',
      iconSize: 'w-7 h-7',
      valueSize: 'text-3xl',
      labelSize: 'text-sm'
    }
  };

  const styles = sizeStyles[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{
        scale: 1.03,
        y: -4,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className={`relative overflow-hidden ${styles.padding} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        clipPath: clipPath !== 'none' ? clipPath : undefined,
        borderRadius: clipPath === 'none' ? borderRadius : undefined,
        border: `1px solid ${theme.colors.primary}25`
      }}
    >
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, transparent 60%)`
        }}
      />

      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: theme.colors.primary }}
      />

      <div
        className="absolute bottom-0 left-0 w-full h-1 opacity-60"
        style={{
          background: `linear-gradient(90deg, ${theme.colors.primary} 0%, transparent 100%)`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`${styles.iconContainer} rounded-xl flex items-center justify-center`}
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              boxShadow: `0 0 20px ${theme.colors.primary}30`
            }}
          >
            <Icon className={styles.iconSize} style={{ color: theme.colors.primary }} />
          </div>

          {trend && trendValue && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend === 'up' ? 'bg-success-500/20 text-success-400' :
                trend === 'down' ? 'bg-error-500/20 text-error-400' :
                'bg-gray-500/20 text-gray-400'
              }`}
            >
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trendValue}
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.15 }}
          className={`${styles.valueSize} font-bold text-white mb-1`}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </motion.div>

        <div className={`${styles.labelSize} text-gray-400`}>{label}</div>

        {subValue && (
          <div className="text-xs text-gray-500 mt-1">{subValue}</div>
        )}
      </div>

      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{
          backgroundColor: theme.colors.primary,
          boxShadow: `0 0 8px ${theme.colors.primary}`
        }}
      />
    </motion.div>
  );
};

export default ThemedStatCard;
