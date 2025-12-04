import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TournamentCard from './TournamentCard';
import { Tournament } from '../../types';
import TournamentFilters from './TournamentFilters';
import { calculateTournamentStatus, calculateRegistrationStatus } from '../../utils/tournamentUtils';

interface TournamentListProps {
  tournaments: Tournament[];
  isLoading: boolean;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedGameId?: string | null;
  onGameFilterClear?: () => void;
  gameFilterName?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TournamentList: React.FC<TournamentListProps> = ({
  tournaments,
  isLoading,
  selectedStatus,
  onStatusChange,
  selectedGameId,
  onGameFilterClear,
  gameFilterName,
  searchQuery,
  onSearchChange
}) => {
  const { t } = useTranslation();
  // Debug logs
  console.log('1. Tournaments prop received:', tournaments);
  console.log('2. Selected status prop:', selectedStatus);
  
  // Process tournaments with calculated status
  const tournamentsWithCalculatedStatus = tournaments.map(tournament => {
    const calculatedStatus = calculateTournamentStatus(tournament);
    const registrationStatus = calculateRegistrationStatus(tournament);
    const processedTournament = {
      ...tournament,
      calculatedStatus,
      registrationStatus
    };
    console.log('3. Processed tournament:', processedTournament);
    return processedTournament;
  });

  // Add calculated and registration status to tournaments
  
  // Include completed tournaments only when the filter explicitly requests them
  // For completed tournaments, show only the last 4
  const eligibleTournaments =
    selectedStatus === 'completed'
      ? tournamentsWithCalculatedStatus
          .filter(tournament => tournament.calculatedStatus === 'completed')
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
          .slice(0, 4)
      : tournamentsWithCalculatedStatus.filter(
          tournament => tournament.calculatedStatus !== 'completed'
        );
  console.log('4. Eligible tournaments after completed filter:', eligibleTournaments);

  // Apply status filter
  const statusFilteredTournaments = eligibleTournaments.filter(tournament => {
    if (selectedStatus === 'all') return true;
    return tournament.calculatedStatus === selectedStatus;
  });
  console.log('5. Tournaments after status filter:', statusFilteredTournaments);

  // Apply search filter
  const searchFilteredTournaments = statusFilteredTournaments.filter(tournament => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const tournamentName = tournament.title?.toLowerCase() || '';
    const tournamentDescription = tournament.description?.toLowerCase() || '';
    const gameName = tournament.game?.toLowerCase() || '';

    console.log('Search debug for tournament:', tournament.title, {
      query,
      tournamentName,
      tournamentDescription,
      gameName,
      nameMatch: tournamentName.includes(query),
      descMatch: tournamentDescription.includes(query),
      gameMatch: gameName.includes(query)
    });

    return tournamentName.includes(query) ||
           tournamentDescription.includes(query) ||
           gameName.includes(query);
  });
  console.log('6. Tournaments after search filter:', searchFilteredTournaments, 'Search query:', searchQuery);
  
  // Sort tournaments: ongoing first, then upcoming
  const sortedTournaments = searchFilteredTournaments.sort((a, b) => {
    // Define priority order: ongoing = 1, upcoming = 2
    const getPriority = (status: string) => {
      switch (status) {
        case 'ongoing': return 1;
        case 'upcoming': return 2;
        default: return 3;
      }
    };
    
    const priorityA = getPriority(a.calculatedStatus);
    const priorityB = getPriority(b.calculatedStatus);
    
    // If same priority, sort by start date (earliest first)
    if (priorityA === priorityB) {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    }
    
    return priorityA - priorityB;
  });
  console.log('7. Final sorted tournaments for display:', sortedTournaments);

  return (
    <div>
      <TournamentFilters 
        selectedStatus={selectedStatus} 
        onStatusChange={onStatusChange}
        selectedGameId={selectedGameId || null}
        onGameFilterClear={onGameFilterClear || (() => {})}
        gameFilterName={gameFilterName}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 animate-pulse">
              <div className="bg-gray-200 dark:bg-dark-100 h-40 sm:h-44 w-full"></div>
              <div className="p-3 sm:p-4">
                <div className="h-5 sm:h-6 bg-gray-200 dark:bg-dark-100 rounded-md mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-dark-100 rounded-md w-2/3 mb-3 sm:mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-dark-100 rounded-md w-1/3"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-dark-100 rounded-md w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedTournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortedTournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-gray-800 mx-2 sm:mx-0">
          <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="font-heading font-semibold text-lg sm:text-xl mb-2 text-gray-900 dark:text-white px-4">
            {isLoading ? t('tournamentList.loading') : t('tournamentList.noTournamentsAvailable')}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 px-4">
            {selectedGameId
              ? t('tournamentList.noTournamentsFound', { gameName: gameFilterName || t('tournamentList.noTournamentsAvailable') })
              : selectedStatus === 'all'
                ? t('tournamentList.noTournamentsFoundGeneral')
                : t('tournamentList.noTournamentsStatus', {
                    status: selectedStatus === 'ongoing'
                      ? t('tournamentList.statusOngoing')
                      : selectedStatus === 'upcoming'
                        ? t('tournamentList.statusUpcoming')
                        : t('tournamentList.statusCompleted')
                  })
            }
          </p>
          {selectedGameId && onGameFilterClear && (
            <button
              onClick={onGameFilterClear}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('tournamentList.viewAllTournaments')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentList;