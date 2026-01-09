import React, { useState } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../../contexts/AppConfigContext';

export type SortOption = 'members' | 'activity' | 'newest' | 'alphabetical';
export type ViewMode = 'grid' | 'list';

interface CommunitySearchControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showFilters?: boolean;
}

export const CommunitySearchControls: React.FC<CommunitySearchControlsProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  showFilters = true,
}) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppConfig();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortOptions: { value: SortOption; labelKey: string }[] = [
    { value: 'members', labelKey: 'communitiesPage.sort.members' },
    { value: 'activity', labelKey: 'communitiesPage.sort.activity' },
    { value: 'newest', labelKey: 'communitiesPage.sort.newest' },
    { value: 'alphabetical', labelKey: 'communitiesPage.sort.alphabetical' },
  ];

  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.labelKey || '';

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
      <div className="relative flex-1">
        <div
          className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${
            isSearchFocused ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            boxShadow: `0 0 0 2px ${primaryColor}40, 0 0 20px ${primaryColor}20`,
          }}
        />
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200"
          style={{ color: isSearchFocused ? primaryColor : '#6B7280' }}
        />
        <input
          type="text"
          placeholder={t('communitiesPage.search')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showFilters && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-gray-300 hover:text-white hover:border-gray-600/50 transition-all duration-200"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{t(currentSortLabel)}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showSortDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700/50 rounded-xl shadow-xl overflow-hidden z-20">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === option.value
                          ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                      style={
                        sortBy === option.value
                          ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                          : undefined
                      }
                    >
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-3 transition-all duration-200 ${
                viewMode === 'grid'
                  ? ''
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={
                viewMode === 'grid'
                  ? { backgroundColor: `${primaryColor}20`, color: primaryColor }
                  : undefined
              }
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-700/50" />
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-3 transition-all duration-200 ${
                viewMode === 'list'
                  ? ''
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={
                viewMode === 'list'
                  ? { backgroundColor: `${primaryColor}20`, color: primaryColor }
                  : undefined
              }
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
