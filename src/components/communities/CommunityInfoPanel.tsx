import React, { useState } from 'react';
import { Globe, Lock, Shield, Star, ChevronDown, Info, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface CommunityInfoPanelProps {
  collapsible?: boolean;
}

export const CommunityInfoPanel: React.FC<CommunityInfoPanelProps> = ({
  collapsible = false,
}) => {
  const { t } = useTranslation();
  const { primaryColor, secondaryColor } = useAppConfig();
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  const tips = [
    {
      icon: <Globe className="w-4 h-4" />,
      titleKey: 'communitiesPage.tips.public.title',
      descKey: 'communitiesPage.tips.public.description',
      color: primaryColor,
    },
    {
      icon: <Lock className="w-4 h-4" />,
      titleKey: 'communitiesPage.tips.private.title',
      descKey: 'communitiesPage.tips.private.description',
      color: '#6B7280',
    },
    {
      icon: <Shield className="w-4 h-4" />,
      titleKey: 'communitiesPage.tips.guidelines.title',
      descKey: 'communitiesPage.tips.guidelines.description',
      color: '#22C55E',
    },
    {
      icon: <Star className="w-4 h-4" />,
      titleKey: 'communitiesPage.tips.featured.title',
      descKey: 'communitiesPage.tips.featured.description',
      color: secondaryColor,
    },
  ];

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}08 0%, rgba(15, 15, 20, 0.95) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '1px solid transparent',
          borderImage: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}20) 1`,
        }}
      />
      <div className="absolute inset-0 rounded-xl border border-gray-700/30 pointer-events-none" />

      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" style={{ color: primaryColor }} />
            <h3 className="font-semibold text-white">
              {t('communitiesPage.tips.title')}
            </h3>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <div className="flex items-center gap-2 p-4 pb-2">
          <Lightbulb className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="font-semibold text-white">
            {t('communitiesPage.tips.title')}
          </h3>
        </div>
      )}

      <div
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-200"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: `${tip.color}15`,
                  color: tip.color,
                }}
              >
                {tip.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm font-medium mb-0.5"
                  style={{ color: tip.color }}
                >
                  {t(tip.titleKey)}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t(tip.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${primaryColor}30, transparent)`,
        }}
      />
    </div>
  );
};
