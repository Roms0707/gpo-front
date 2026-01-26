import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TournamentFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedGameId: string | null;
  onGameFilterClear: () => void;
  gameFilterName: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TournamentFilters: React.FC<TournamentFiltersProps> = ({
  selectedStatus,
  onStatusChange,
  selectedGameId,
  onGameFilterClear,
  gameFilterName,
  searchQuery,
  onSearchChange
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="font-heading text-xl sm:text-2xl font-bold">{t('tournamentFilters.availableTournaments')}</h2>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={t('tournamentFilters.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              console.log('Search input changed:', e.target.value);
              onSearchChange(e.target.value);
            }}
            className="input pl-10 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
            selectedStatus === 'all'
              ? 'bg-primary-600 text-white dark:bg-primary-600 dark:text-white'
              : 'bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-300'
          }`}
          onClick={() => {
            console.log('Filter button clicked: all');
            onStatusChange('all');
          }}
        >
          {t('tournamentFilters.all')}
        </button>

        <button
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
            selectedStatus === 'ongoing'
              ? 'bg-error-600 text-white dark:bg-error-600 dark:text-white'
              : 'bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-300'
          }`}
          onClick={() => {
            console.log('Filter button clicked: ongoing');
            onStatusChange('ongoing');
          }}
        >
          {t('tournamentFilters.ongoing')}
        </button>

        <button
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
            selectedStatus === 'upcoming'
              ? 'bg-primary-600 text-white dark:bg-primary-600 dark:text-white'
              : 'bg-gray-200 dark:bg-dark-100 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-300'
          }`}
          onClick={() => {
            console.log('Filter button clicked: upcoming');
            onStatusChange('upcoming');
          }}
        >
          {t('tournamentFilters.upcoming')}
        </button>

        <button
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
            selectedStatus === 'completed'
              ? 'bg-gray-600 text-white'
              : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
          }`}
          onClick={() => onStatusChange('completed')}
        >
          {t('tournamentFilters.completed')}
        </button>

        {selectedGameId && gameFilterName && (
          <div className="flex items-center bg-info-100 dark:bg-info-500/20 text-info-700 dark:text-info-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm">
            <span className="truncate max-w-[120px] sm:max-w-none">{t('tournamentFilters.gameFilter', { gameName: gameFilterName })}</span>
            <button
              onClick={onGameFilterClear}
              className="ml-1 sm:ml-2 hover:text-info-900 dark:hover:text-white flex-shrink-0"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentFilters;
