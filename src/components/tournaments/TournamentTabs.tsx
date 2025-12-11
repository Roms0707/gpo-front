import React from 'react';
import { Home, Target, Award, BookOpen, FileText, Users, Gift, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { APP_CONFIG } from '../../constants';

interface TournamentTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isTeamTournament: boolean;
  userTeamId: string | null;
  isTeamCaptain: boolean;
  tournamentGameId?: string;
}

const SUBSCRIPTION_PROTECTED_TABS = ['training', 'training-games'];

const TournamentTabs: React.FC<TournamentTabsProps> = ({
  activeTab,
  setActiveTab,
  isTeamTournament,
  userTeamId,
  isTeamCaptain,
  tournamentGameId
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { checkAccess, isKliento } = useSubscriptionGuard();

  // Check if current tournament game should show training games
  const shouldShowTrainingGames = tournamentGameId && (
    APP_CONFIG.AIM_TRAINER_GAME_IDS.includes(tournamentGameId) ||
    APP_CONFIG.REACTION_TIME_ONLY_GAME_IDS.includes(tournamentGameId)
  );

  const tabs = [
    { id: 'home', label: t('tournamentTabs.home'), icon: Home },
    { id: 'rewards', label: t('tournamentTabs.rewards'), icon: Gift },
    { id: 'bracket', label: t('tournamentTabs.bracket'), icon: Target },
    { id: 'classement', label: t('tournamentTabs.ranking'), icon: Award },
    { id: 'rules', label: t('tournamentTabs.rules'), icon: FileText }
  ];

  // Add training tab only if user is logged in
  if (user) {
    tabs.splice(4, 0, { id: 'training', label: t('tournamentTabs.training'), icon: BookOpen });
  }

  // Add training games tab for specific games
  if (shouldShowTrainingGames) {
    tabs.push({ id: 'training-games', label: t('tournamentTabs.trainingGames'), icon: Zap });
  }

  // Only add the LFP tab for team tournaments
  if (isTeamTournament) {
    tabs.push({ id: 'lfp', label: t('tournamentTabs.lookingForPlayers'), icon: Users });
  }

  const handleTabClick = async (tabId: string) => {
    if (isKliento && SUBSCRIPTION_PROTECTED_TABS.includes(tabId)) {
      const hasAccess = await checkAccess();
      if (!hasAccess) {
        return;
      }
    }
    setActiveTab(tabId);
  };

  return (
    <div className="bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40">
      <div className="container mx-auto px-4">
        {/* Scrollable tabs container with gradient indicators */}
        <div className="relative">
          {/* Left gradient indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-dark-100 to-transparent pointer-events-none z-10 hidden sm:block" />

          {/* Right gradient indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-dark-100 to-transparent pointer-events-none z-10 hidden sm:block" />

          {/* Tabs */}
          <div
            className="flex justify-evenly sm:justify-start sm:space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
            role="tablist"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex items-center py-3 sm:py-4 px-2 sm:px-4 md:px-2 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap snap-start flex-shrink-0 ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-500 scale-105'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:scale-105'
                }`}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`${id}-panel`}
                id={`${id}-tab`}
                style={{ minHeight: '44px' }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dot indicators for mobile */}
        <div className="flex justify-center gap-1 py-1.5 sm:hidden">
          {tabs.map(({ id }) => (
            <button
              key={`dot-${id}`}
              onClick={() => handleTabClick(id)}
              className={`w-1 h-1 rounded-full transition-all duration-200 ${
                activeTab === id
                  ? 'bg-primary-500 w-2.5'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label={t('tournamentTabs.goToTab', { tab: id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentTabs;