import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { groupRegistrationsByStatus, formatDate } from '../../utils/profileUtils';
import StatusBadge from '../ui/StatusBadge';

interface TournamentSectionProps {
  registrations: any[];
  isLoading: boolean;
  error: string | null;
}

const TournamentSection: React.FC<TournamentSectionProps> = ({ registrations, isLoading, error }) => {
  const { t } = useTranslation();
  const groupedRegistrations = groupRegistrationsByStatus(registrations);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded mb-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming tournaments */}
      <div>
        <h2 className="font-heading font-semibold text-xl mb-4 flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-5 w-5 mr-2 text-primary-500" />
          {t('profile.upcomingTournaments')}
        </h2>

        {groupedRegistrations.upcoming && groupedRegistrations.upcoming.length > 0 ? (
          <div className="space-y-4">
            {groupedRegistrations.upcoming.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="block bg-gray-100 dark:bg-dark-200 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{tournament.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(tournament.date)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={tournament.registrationStatus} />
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-600 text-white text-xs font-medium">
                      {t('profile.upcoming')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">{t('profile.noUpcomingTournaments')}</p>
          </div>
        )}
      </div>

      {/* Active tournaments */}
      <div>
        <h2 className="font-heading font-semibold text-xl mb-4 flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-5 w-5 mr-2 text-error-500" />
          {t('profile.activeTournamentsSection')}
        </h2>

        {groupedRegistrations.active && groupedRegistrations.active.length > 0 ? (
          <div className="space-y-4">
            {groupedRegistrations.active.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="block bg-gray-100 dark:bg-dark-200 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{tournament.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(tournament.date)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={tournament.registrationStatus} />
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-error-600 text-white text-xs font-medium">
                      <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></span>
                      {t('profile.active')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">{t('profile.noActiveTournaments')}</p>
          </div>
        )}
      </div>

      {/* Past tournaments */}
      <div>
        <h2 className="font-heading font-semibold text-xl mb-4 flex items-center text-gray-900 dark:text-white">
          <Trophy className="h-5 w-5 mr-2 text-gray-500" />
          {t('profile.pastTournaments')}
        </h2>

        {groupedRegistrations.past && groupedRegistrations.past.length > 0 ? (
          <div className="space-y-4">
            {groupedRegistrations.past.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="block bg-gray-100 dark:bg-dark-200 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{tournament.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(tournament.date)}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-600 text-white text-xs font-medium">
                    {t('profile.finished')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">{t('profile.noPastTournaments')}</p>
          </div>
        )}
      </div>

      {/* When no tournaments at all */}
      {Object.keys(groupedRegistrations).length === 0 && (
        <div className="bg-gray-100 dark:bg-dark-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('profile.notRegisteredAnyTournament')}</p>
          <Link to="/" className="btn btn-primary">
            {t('profile.browseTournamentsButton')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default TournamentSection;