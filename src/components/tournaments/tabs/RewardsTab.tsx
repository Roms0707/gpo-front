import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { Tournament, TournamentPrize } from '../../../types';
import { calculateTotalPrizePool, segregatePrizesByType } from '../../../utils/prizePoolUtils';
import MonetaryPodium from './MonetaryPodium';
import PhysicalDigitalGallery from './PhysicalDigitalGallery';

interface RewardsTabProps {
  tournament: Tournament;
  prizes: TournamentPrize[];
  gameName: string;
}

const RewardsTab: React.FC<RewardsTabProps> = ({ tournament, prizes, gameName }) => {
  const { t } = useTranslation();
  const segregated = segregatePrizesByType(prizes);
  const prizeCalculation = calculateTotalPrizePool(prizes);

  return (
    <div id="walkthrough-tournament-rewards" className="bg-white dark:bg-dark-100 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-800" role="tabpanel" aria-labelledby="rewards-tab">
      <h2 className="font-heading font-bold text-xl sm:text-2xl mb-4 sm:mb-6 flex items-center text-gray-900 dark:text-white">
        <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 mr-2" aria-hidden="true" />
        <span className="hidden sm:inline">{t('rewardsTab.title', { title: tournament?.title })}</span>
        <span className="sm:hidden">{t('rewardsTab.titleShort')}</span>
      </h2>

      {prizes.length > 0 ? (
        <div className="space-y-8 sm:space-y-12">
          {segregated.hasMonetary && (
            <MonetaryPodium
              prizes={segregated.monetary}
              totalPrizePool={prizeCalculation.total}
              currency={prizeCalculation.currency}
            />
          )}

          {segregated.hasPhysicalDigital && (
            <div className={segregated.hasMonetary ? 'mt-8 pt-8 sm:mt-12 sm:pt-12 border-t border-gray-200 dark:border-gray-700' : ''}>
              <PhysicalDigitalGallery prizes={segregated.physicalDigital} />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Gift className="h-12 w-12 text-gray-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('rewardsTab.noRewards')}
          </p>
        </div>
      )}
    </div>
  );
};

export default RewardsTab;
