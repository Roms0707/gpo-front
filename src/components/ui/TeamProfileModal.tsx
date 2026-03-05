import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, MapPin, Calendar, Trophy, User, Loader, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/formatters';
import { countries } from '../../utils/countries';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  username: string;
  avatar_url: string | null;
  country: string | null;
  is_captain: boolean;
}

interface TeamProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string | null;
}

const TeamProfileModal: React.FC<TeamProfileModalProps> = ({
  isOpen,
  onClose,
  teamId
}) => {
  const { t } = useTranslation();
  const [teamProfile, setTeamProfile] = useState<any | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'stats'>('members');

  useEffect(() => {
    const loadTeamProfile = async () => {
      if (!isOpen || !teamId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch team data
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            captain_id,
            tournament_id,
            created_at,
            tournaments:tournament_id (
              id,
              title,
              game_id,
              games:game_id (
                id,
                name
              )
            )
          `)
          .eq('id', teamId)
          .single();

        if (teamError) {
          console.error('Error loading team profile:', teamError);
          throw new Error(t('teamProfileModal.errorLoadingTeam'));
        }

        setTeamProfile(teamData);

        // Fetch team members
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            id,
            user_id,
            role,
            status,
            users:user_id (
              id,
              username,
              avatar_url,
              country
            )
          `)
          .eq('team_id', teamId)
          .eq('status', 'accepted');

        if (membersError) {
          console.error('Error loading team members:', membersError);
          throw new Error(t('teamProfileModal.errorLoadingMembers'));
        }

        // Transform members data
        const transformedMembers = membersData.map(member => ({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          status: member.status,
          username: member.users.username,
          avatar_url: member.users.avatar_url,
          country: member.users.country,
          is_captain: member.user_id === teamData.captain_id
        }));

        // Sort members (captain first, then alphabetically)
        const sortedMembers = transformedMembers.sort((a, b) => {
          if (a.is_captain && !b.is_captain) return -1;
          if (!a.is_captain && b.is_captain) return 1;
          return a.username.localeCompare(b.username);
        });

        setTeamMembers(sortedMembers);

      } catch (error) {
        console.error('Error loading team profile:', error);
        setError(error instanceof Error ? error.message : t('teamProfileModal.unknownError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamProfile();
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Get country name from country code
  const getCountryName = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
            {t('teamProfileModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label={t('teamProfileModal.close')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader className="h-10 w-10 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('teamProfileModal.loading')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12">
              <AlertTriangle className="h-12 w-12 text-error-500 mb-4" />
              <p className="text-error-600 dark:text-error-400 font-medium mb-2">{t('teamProfileModal.error')}</p>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          ) : teamProfile ? (
            <div>
              {/* Team Header */}
              <div className="bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-600/20 dark:to-secondary-600/20 p-6">
                <div className="flex items-center">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-dark-200 rounded-full flex items-center justify-center overflow-hidden mr-4">
                    <Users className="h-10 w-10 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white">{teamProfile.name}</h3>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                      <Trophy className="h-4 w-4 mr-1 text-warning-400" />
                      {teamProfile.tournaments?.title || t('common.tournament')}
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {t('teamProfileModal.createdOn')} {formatDate(teamProfile.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex-1 py-3 px-4 text-sm font-medium ${
                    activeTab === 'members'
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  {t('teamProfileModal.membersTab')} ({teamMembers.length})
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-3 px-4 text-sm font-medium ${
                    activeTab === 'stats'
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Trophy className="h-4 w-4 inline mr-2" />
                  {t('teamProfileModal.statsTab')}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t('teamProfileModal.teamMembers')}</h4>

                    {teamMembers.length > 0 ? (
                      <div className="space-y-4">
                        {teamMembers.map(member => (
                          <div key={member.id} className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg flex items-center">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-dark-300 rounded-full flex items-center justify-center overflow-hidden mr-4">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <User className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h5 className="font-medium text-gray-900 dark:text-white">{member.username}</h5>
                                {member.is_captain && (
                                  <span className="ml-2 bg-warning-500/20 text-warning-400 text-xs px-2 py-0.5 rounded-full flex items-center">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {t('teamProfileModal.captain')}
                                  </span>
                                )}
                              </div>
                              {member.country && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {getCountryName(member.country)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-dark-300 text-gray-600 dark:text-gray-400">
                              {member.role === 'captain' ? t('teamProfileModal.captain') : t('teamProfileModal.member')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-dark-200 p-6 rounded-lg text-center">
                        <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">{t('teamProfileModal.noMembers')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t('teamProfileModal.teamStats')}</h4>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary-400">
                          {teamMembers.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('teamProfileModal.members')}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-warning-400">
                          {teamProfile.tournaments?.games?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('teamProfileModal.game')}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-error-400">
                          0
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('teamProfileModal.matchesPlayed')}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-success-400">
                          0
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('teamProfileModal.victories')}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-lg">
                      <h5 className="font-medium mb-3 flex items-center text-gray-900 dark:text-white">
                        <Trophy className="h-4 w-4 mr-2 text-warning-400" />
                        {t('teamProfileModal.currentTournament')}
                      </h5>
                      <div className="p-3 bg-white dark:bg-dark-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{teamProfile.tournaments?.title || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{teamProfile.tournaments?.games?.name || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <Users className="h-16 w-16 text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('teamProfileModal.noInformation')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamProfileModal;
