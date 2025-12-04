import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Users, Trophy, Calendar, MapPin, UserCheck, Globe, Gift } from 'lucide-react';
import { Tournament, TournamentPrize } from '../../../types';
import { formatDate, formatEligibleCountries } from '../../../utils/formatters';
import ExpandableText from '../../ui/ExpandableText';

interface HomeTabProps {
  tournament: Tournament;
  prizes: TournamentPrize[];
  gameName: string;
}

const HomeTab: React.FC<HomeTabProps> = ({ tournament, prizes, gameName }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Tournament Details */}
      <div className="bg-white dark:bg-dark-100 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-800" role="tabpanel" id="home-panel" aria-labelledby="home-tab">
        <h2 className="font-heading font-bold text-xl sm:text-2xl mb-4 sm:mb-5 md:mb-6 text-gray-900 dark:text-white">{t('homeTab.title')}</h2>

        {tournament.description && (
          <div className="mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-dark-200/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <ExpandableText
              text={tournament.description}
              maxLines={4}
              maxLinesMobile={2}
              maxLinesTablet={3}
              className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed"
              showGradient={false}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Tournament Start Date - Added to details section */}
            <div className="flex items-start sm:items-center">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.tournamentStartDate')}</p>
                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words">{tournament && formatDate(tournament.startDate)}</p>
              </div>
            </div>

            <div className="flex items-start sm:items-center">
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.game')}</p>
                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words">{gameName || tournament?.game}</p>
              </div>
            </div>

            <div className="flex items-start sm:items-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.mode')}</p>
                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words">{tournament?.mode}</p>
              </div>
            </div>

            <div className="flex items-start sm:items-center">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.format')}</p>
                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words">{tournament?.format}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-center">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.tournamentEndDate')}</p>
                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words">{tournament && formatDate(tournament.endDate)}</p>
              </div>
            </div>

            {tournament?.locationType && (
              <div className="flex items-start sm:items-center">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.location')}</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words">
                    {tournament.locationType}
                    {tournament.locationName && ` - ${tournament.locationName}`}
                  </p>
                </div>
              </div>
            )}

            {tournament?.minimum_age && (
              <div className="flex items-start sm:items-center">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.minimumAge')}</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{tournament.minimum_age} {t('homeTab.years')}</p>
                </div>
              </div>
            )}

            {tournament?.eligible_countries && (
              <div className="flex items-start sm:items-center">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('homeTab.eligibleCountries')}</p>
                  <p className="font-medium text-sm sm:text-base md:text-lg text-gray-900 dark:text-white break-words">
                    {formatEligibleCountries(tournament.eligible_countries)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeTab;