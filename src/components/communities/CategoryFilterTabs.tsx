import React from 'react';
import { Gamepad2, Coffee, Trophy, MessageCircle, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../../contexts/AppConfigContext';

export type CategoryType = 'all' | 'gaming' | 'casual' | 'tournament' | 'social';

interface CategoryFilterTabsProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

interface CategoryItem {
  id: CategoryType;
  labelKey: string;
  icon: React.ReactNode;
}

export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();

  const categories: CategoryItem[] = [
    {
      id: 'all',
      labelKey: 'communitiesPage.categories.all',
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      id: 'gaming',
      labelKey: 'communitiesPage.categories.gaming',
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    {
      id: 'casual',
      labelKey: 'communitiesPage.categories.casual',
      icon: <Coffee className="w-4 h-4" />,
    },
    {
      id: 'tournament',
      labelKey: 'communitiesPage.categories.tournament',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      id: 'social',
      labelKey: 'communitiesPage.categories.social',
      icon: <MessageCircle className="w-4 h-4" />,
    },
  ];

  return (
    <div className="relative mb-6 sm:mb-8">
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800'
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
                        boxShadow: `0 0 20px ${primaryColor}15, inset 0 0 20px ${primaryColor}10`,
                      }
                    : undefined
                }
              >
                <span
                  className="transition-colors duration-300"
                  style={isActive ? { color: primaryColor } : undefined}
                >
                  {category.icon}
                </span>
                <span>{t(category.labelKey)}</span>

                {isActive && (
                  <>
                    <div
                      className="absolute inset-0 rounded-xl border pointer-events-none"
                      style={{ borderColor: `${primaryColor}40` }}
                    />
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-1/2 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                        boxShadow: `0 0 10px ${primaryColor}60`,
                      }}
                    />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-dark-200 to-transparent pointer-events-none sm:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-dark-200 to-transparent pointer-events-none sm:hidden" />
    </div>
  );
};
