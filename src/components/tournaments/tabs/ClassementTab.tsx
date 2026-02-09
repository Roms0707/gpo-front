import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Loader, User, Users } from 'lucide-react';
import { Tournament } from '../../../types';
import PlayerProfileModal from '../../ui/PlayerProfileModal';
import TeamProfileModal from '../../ui/TeamProfileModal';

interface ClassementTabProps {
  tournament: Tournament;
  tournamentRankings: any[];
  isLoadingRankings: boolean;
  gameName: string;
}

const ClassementTab: React.FC<ClassementTabProps> = ({
  tournament,
  tournamentRankings,
  isLoadingRankings,
  gameName
}) => {
  const { t } = useTranslation();
  const isTeamTournament = tournament?.mode?.toLowerCase().includes('team');

  // Profile modals state
  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [isTeamProfileModalOpen, setIsTeamProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Handle player profile click
  const handlePlayerClick = (userId: string) => {
    console.log('[ClassementTab] Player clicked with userId:', userId);
    if (!userId) {
      console.error('[ClassementTab] Invalid userId - cannot open profile');
      return;
    }
    setSelectedPlayerId(userId);
    setIsPlayerProfileModalOpen(true);
  };

  // Handle team profile click
  const handleTeamClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsTeamProfileModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800" role="tabpanel" id="classement-panel" aria-labelledby="classement-tab">
      <h2 className="font-heading font-bold text-xl sm:text-2xl mb-4 sm:mb-6 flex items-center text-gray-900 dark:text-white">
        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-warning-500 mr-2" aria-hidden="true" />
        <span className="hidden sm:inline">{t('classementTab.title', { title: tournament?.title })}</span>
        <span className="sm:hidden">{t('classementTab.titleShort')}</span>
      </h2>

      {isLoadingRankings ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin text-primary-500" aria-hidden="true" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">{t('classementTab.loading')}</span>
        </div>
      ) : tournamentRankings.length > 0 ? (
        <>
          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left" aria-label={t('classementTab.title', { title: tournament?.title })}>
              <thead className="bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="p-4 font-medium" scope="col">#</th>
                  <th className="p-4 font-medium" scope="col">{isTeamTournament ? t('classementTab.team') : t('classementTab.player')}</th>
                  <th className="p-4 font-medium text-center" scope="col">{t('classementTab.matches')}</th>
                  <th className="p-4 font-medium text-center" scope="col">{t('classementTab.victories')}</th>
                  <th className="p-4 font-medium text-center" scope="col">{t('classementTab.defeats')}</th>
                  <th className="p-4 font-medium text-center" scope="col">{t('classementTab.winLossRatio')}</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {tournamentRankings.map((entry) => (
                <tr
                  key={isTeamTournament ? entry.team_id : entry.user_id}
                  className="hover:bg-gray-50 dark:hover:bg-dark-200/50 transition-colors cursor-pointer"
                  onClick={() => isTeamTournament
                    ? handleTeamClick(entry.team_id)
                    : handlePlayerClick(entry.user_id)
                  }
                  tabIndex={0}
                  aria-label={`${isTeamTournament ? t('classementTab.teamLabel') : t('classementTab.playerLabel')} ${isTeamTournament ? entry.team_name : entry.username}, ${t('classementTab.rank')} ${entry.rank}, ${entry.wins} ${t('classementTab.victoriesShort').toLowerCase()}, ${entry.losses || 0} ${t('classementTab.defeatsShort').toLowerCase()}`}
                >
                  <td className="p-4 text-center">
                    <span className="font-medium text-gray-900 dark:text-white">{entry.rank}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      {!isTeamTournament && (
                        <div className="w-8 h-8 rounded-full bg-dark-300 overflow-hidden mr-3 flex-shrink-0 flex items-center justify-center">
                          {entry.avatar_url ? (
                            <img
                              src={entry.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                              aria-hidden="true"
                            />
                          ) : (
                            <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          )}
                        </div>
                      )}
                      {isTeamTournament && (
                        <Users className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {isTeamTournament ? entry.team_name : entry.username}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-medium text-gray-900 dark:text-white">
                    {entry.total_matches || 0}
                  </td>
                  <td className="p-4 text-center text-green-500 font-medium">
                    {entry.wins || 0}
                  </td>
                  <td className="p-4 text-center text-red-500 font-medium">
                    {entry.losses || 0}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-medium ${
                      (entry.win_rate || 0) >= 70 ? 'text-green-500' :
                      (entry.win_rate || 0) >= 50 ? 'text-blue-500' :
                      'text-red-500'
                    }`}>
                      {entry.win_rate || 0}%
                    </span>
                  </td>
                </tr>
              ))}

                {tournamentRankings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-600 dark:text-gray-400">
                      {t('classementTab.noParticipants', { type: isTeamTournament ? t('classementTab.teamLabel').toLowerCase() : t('classementTab.playerLabel').toLowerCase() })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {tournamentRankings.map((entry) => (
              <div
                key={isTeamTournament ? entry.team_id : entry.user_id}
                onClick={() => isTeamTournament
                  ? handleTeamClick(entry.team_id)
                  : handlePlayerClick(entry.user_id)
                }
                className="bg-gray-50 dark:bg-dark-200 rounded-lg p-4 cursor-pointer active:scale-[0.98] transition-transform"
                tabIndex={0}
                aria-label={`${isTeamTournament ? t('classementTab.teamLabel') : t('classementTab.playerLabel')} ${isTeamTournament ? entry.team_name : entry.username}, ${t('classementTab.rank')} ${entry.rank}`}
              >
                {/* Header with rank and name */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="font-bold text-primary-500 text-sm">#{entry.rank}</span>
                    </div>
                    <div className="flex items-center">
                      {!isTeamTournament && (
                        <div className="w-8 h-8 rounded-full bg-dark-300 overflow-hidden mr-2 flex-shrink-0 flex items-center justify-center">
                          {entry.avatar_url ? (
                            <img
                              src={entry.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                              aria-hidden="true"
                            />
                          ) : (
                            <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          )}
                        </div>
                      )}
                      {isTeamTournament && (
                        <Users className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {isTeamTournament ? entry.team_name : entry.username}
                      </span>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${
                    (entry.win_rate || 0) >= 70 ? 'text-green-500' :
                    (entry.win_rate || 0) >= 50 ? 'text-blue-500' :
                    'text-red-500'
                  }`}>
                    {entry.win_rate || 0}%
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-white dark:bg-dark-100 rounded p-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('classementTab.matchesShort')}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{entry.total_matches || 0}</div>
                  </div>
                  <div className="text-center bg-white dark:bg-dark-100 rounded p-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('classementTab.victoriesShort')}</div>
                    <div className="font-semibold text-green-500">{entry.wins || 0}</div>
                  </div>
                  <div className="text-center bg-white dark:bg-dark-100 rounded p-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('classementTab.defeatsShort')}</div>
                    <div className="font-semibold text-red-500">{entry.losses || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('classementTab.noData')}
            {tournament.status === 'upcoming' && (
              <span className="block mt-2">{t('classementTab.noDataYet')}</span>
            )}
          </p>
        </div>
      )}

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
        gameId={tournament?.game_id}
      />

      {/* Team Profile Modal */}
      <TeamProfileModal
        isOpen={isTeamProfileModalOpen}
        onClose={() => setIsTeamProfileModalOpen(false)}
        teamId={selectedTeamId}
      />
    </div>
  );
};

export default ClassementTab;
