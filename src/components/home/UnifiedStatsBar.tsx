import React, { useState, useEffect, ReactNode } from 'react';
import { Trophy, Gamepad2, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { FlippableStatCard } from './FlippableStatCard';

interface StatConfig {
  value: number;
  labelKey: string;
  backLabelKey: string;
  icon: ReactNode;
  color: string;
  isLive?: boolean;
}

interface UnifiedStatsBarProps {
  activeTournamentsCount: number;
  gamesCount: number;
  liveTournamentsCount: number;
  onScrollToTournaments: () => void;
}

export const UnifiedStatsBar: React.FC<UnifiedStatsBarProps> = ({
  activeTournamentsCount,
  gamesCount,
  liveTournamentsCount,
  onScrollToTournaments,
}) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const goldColor = '#C8AA6E';
  const liveColor = '#EF4444';

  const stats: StatConfig[] = [
    {
      value: activeTournamentsCount,
      labelKey: 'home.activeTournaments',
      backLabelKey: 'home.statsBar.viewTournaments',
      icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: goldColor,
    },
    {
      value: gamesCount,
      labelKey: 'home.gamesAvailable',
      backLabelKey: 'home.statsBar.browseGames',
      icon: <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: primaryColor,
    },
    {
      value: liveTournamentsCount,
      labelKey: 'home.liveTournaments',
      backLabelKey: 'home.statsBar.watchLive',
      icon: <Radio className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: liveColor,
      isLive: true,
    },
  ];

  return (
    <div
      className={`relative transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative overflow-hidden"
        style={{
          clipPath: 'polygon(2% 0, 98% 0, 100% 50%, 98% 100%, 2% 100%, 0% 50%)',
        }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, rgba(15, 15, 20, 0.95) 0%, rgba(25, 25, 35, 0.98) 50%, rgba(15, 15, 20, 0.95) 100%)`,
            opacity: isHovered ? 1 : 0.9,
          }}
        />

        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23${goldColor.slice(1)}' stroke-width='0.5' opacity='0.15'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px',
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${goldColor}15 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0.5,
          }}
        />

        <div className="relative z-10 px-6 sm:px-8 md:px-12 py-2">
          <div className="grid grid-cols-3 divide-x divide-gray-700/50">
            {stats.map((stat, index) => (
              <FlippableStatCard
                key={index}
                value={stat.value}
                label={t(stat.labelKey, { count: stat.value })}
                backLabel={t(stat.backLabelKey)}
                icon={stat.icon}
                accentColor={stat.color}
                isLive={stat.isLive}
                delay={600 + index * 150}
                onClick={onScrollToTournaments}
              />
            ))}
          </div>
        </div>

        <div
          className="absolute top-0 left-0 right-0 h-[1px] transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${goldColor}${isHovered ? '80' : '40'} 20%, ${goldColor}${isHovered ? 'cc' : '60'} 50%, ${goldColor}${isHovered ? '80' : '40'} 80%, transparent 100%)`,
            boxShadow: isHovered ? `0 0 10px ${goldColor}40, 0 0 20px ${goldColor}20` : 'none',
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-[1px] transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${goldColor}${isHovered ? '60' : '30'} 20%, ${goldColor}${isHovered ? '80' : '40'} 50%, ${goldColor}${isHovered ? '60' : '30'} 80%, transparent 100%)`,
          }}
        />

        <div className="absolute top-0 left-[1.5%] w-3 h-3 sm:w-4 sm:h-4 -translate-y-1/2">
          <div
            className="w-full h-full rotate-45 transition-all duration-500"
            style={{
              backgroundColor: isHovered ? goldColor : `${goldColor}80`,
              boxShadow: isHovered ? `0 0 8px ${goldColor}80` : 'none',
            }}
          />
        </div>
        <div className="absolute top-0 right-[1.5%] w-3 h-3 sm:w-4 sm:h-4 -translate-y-1/2">
          <div
            className="w-full h-full rotate-45 transition-all duration-500"
            style={{
              backgroundColor: isHovered ? goldColor : `${goldColor}80`,
              boxShadow: isHovered ? `0 0 8px ${goldColor}80` : 'none',
            }}
          />
        </div>
        <div className="absolute bottom-0 left-[1.5%] w-3 h-3 sm:w-4 sm:h-4 translate-y-1/2">
          <div
            className="w-full h-full rotate-45 transition-all duration-500"
            style={{
              backgroundColor: isHovered ? goldColor : `${goldColor}80`,
              boxShadow: isHovered ? `0 0 8px ${goldColor}80` : 'none',
            }}
          />
        </div>
        <div className="absolute bottom-0 right-[1.5%] w-3 h-3 sm:w-4 sm:h-4 translate-y-1/2">
          <div
            className="w-full h-full rotate-45 transition-all duration-500"
            style={{
              backgroundColor: isHovered ? goldColor : `${goldColor}80`,
              boxShadow: isHovered ? `0 0 8px ${goldColor}80` : 'none',
            }}
          />
        </div>
      </div>

      <div
        className="absolute -inset-[1px] -z-10 transition-all duration-500"
        style={{
          clipPath: 'polygon(2% 0, 98% 0, 100% 50%, 98% 100%, 2% 100%, 0% 50%)',
          background: `linear-gradient(135deg, ${goldColor}${isHovered ? '60' : '30'} 0%, transparent 30%, transparent 70%, ${goldColor}${isHovered ? '60' : '30'} 100%)`,
          filter: isHovered ? `blur(1px)` : 'none',
        }}
      />

      {isHovered && (
        <div
          className="absolute inset-0 -z-20 animate-pulse"
          style={{
            clipPath: 'polygon(2% 0, 98% 0, 100% 50%, 98% 100%, 2% 100%, 0% 50%)',
            background: `radial-gradient(ellipse at center, ${goldColor}10 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      )}
    </div>
  );
};
