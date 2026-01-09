import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Radio, Plus, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface CommunitiesHeroProps {
  totalCommunities: number;
  totalMembers: number;
  onlineNow: number;
  onCreateCommunity: () => void;
}

interface StatItem {
  value: number;
  labelKey: string;
  icon: React.ReactNode;
  color: string;
  isLive?: boolean;
}

export const CommunitiesHero: React.FC<CommunitiesHeroProps> = ({
  totalCommunities,
  totalMembers,
  onlineNow,
  onCreateCommunity,
}) => {
  const { t } = useTranslation();
  const { primaryColor, secondaryColor, brandName } = useAppConfig();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const stats: StatItem[] = [
    {
      value: totalCommunities,
      labelKey: 'communitiesPage.hero.totalCommunities',
      icon: <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: primaryColor,
    },
    {
      value: totalMembers,
      labelKey: 'communitiesPage.hero.totalMembers',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: secondaryColor,
    },
    {
      value: onlineNow,
      labelKey: 'communitiesPage.hero.onlineNow',
      icon: <Radio className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: '#22C55E',
      isLive: true,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8 sm:mb-10">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}25 0%, rgba(15, 15, 20, 0.98) 50%, ${secondaryColor}15 100%)`,
        }}
      />

      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            ${primaryColor}15 10px,
            ${primaryColor}15 20px
          )`,
        }}
      />

      <div
        className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 sm:w-72 sm:h-72 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${secondaryColor}15 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div
          className={`text-center transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 sm:mb-6"
            style={{
              backgroundColor: `${primaryColor}15`,
              border: `1px solid ${primaryColor}30`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span className="text-xs sm:text-sm font-medium" style={{ color: primaryColor }}>
              {brandName}
            </span>
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, #FFFFFF 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
              }}
            >
              {t('communitiesPage.title')}
            </span>
          </h1>

          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            {t('communitiesPage.subtitle')}
          </p>

          <button
            onClick={onCreateCommunity}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300"
            style={{
              background: isHovered
                ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                : `linear-gradient(135deg, ${primaryColor}CC 0%, ${secondaryColor}CC 100%)`,
              boxShadow: isHovered
                ? `0 0 30px ${primaryColor}40, 0 10px 40px ${primaryColor}20`
                : `0 0 20px ${primaryColor}20`,
            }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90" />
            <span className="text-white">{t('communitiesPage.hero.createCommunity')}</span>
          </button>
        </div>

        <div
          className={`mt-8 sm:mt-12 transition-all duration-700 delay-300 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-xl mx-auto">
            <div className="relative overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
              <div className="grid grid-cols-3 divide-x divide-gray-700/50">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="relative px-3 sm:px-6 py-4 sm:py-5 text-center group hover:bg-gray-800/30 transition-colors duration-300"
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                      {stat.isLive && (
                        <span className="relative flex h-2 w-2">
                          <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: stat.color }}
                          />
                          <span
                            className="relative inline-flex rounded-full h-2 w-2"
                            style={{ backgroundColor: stat.color }}
                          />
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1"
                      style={{ color: stat.color }}
                    >
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      {t(stat.labelKey)}
                    </div>
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-3/4 transition-all duration-300"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${primaryColor}40 50%, transparent 100%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${secondaryColor}30 50%, transparent 100%)`,
        }}
      />
    </div>
  );
};
