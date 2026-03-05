import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useProfileData } from '../hooks/useProfileData';
import { usePlayerPrimaryGame, calculateXpFromActivity } from '../hooks/usePlayerPrimaryGame';
import { supabase } from '../lib/supabase';
import { Game } from '../types';
import ProfileHeroBanner from '../components/profile/ProfileHeroBanner';
import ProfileTabBar, { ProfileTab } from '../components/profile/ProfileTabBar';
import ProfileSetupWidget from '../components/profile/ProfileSetupWidget';
import ProfileSetupModal from '../components/profile/ProfileSetupModal';
import ProfileStatsTab from '../components/profile/ProfileStatsTab';
import ProfileAchievementsGrid from '../components/profile/ProfileAchievementsGrid';
import ActiveTournamentCard from '../components/profile/ActiveTournamentCard';
import ProfileTournamentHub from '../components/profile/ProfileTournamentHub';
import ProfileFriendsRow from '../components/profile/ProfileFriendsRow';
import ProfileThemeCard from '../components/profile/ProfileThemeCard';
import ProfileSocialLinksCard from '../components/profile/ProfileSocialLinksCard';
import ProfileGamingStatsCard from '../components/profile/ProfileGamingStatsCard';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';
import ProfileQuestProgress from '../components/profile/ProfileQuestProgress';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
  unlocked_at?: string;
}

const VALID_TABS: ProfileTab[] = ['overview', 'tournaments', 'stats', 'friends', 'achievements'];

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user,
    userProfile,
    registrations,
    friends,
    gamingAccounts,
    isLoading,
    isLoadingFriends
  } = useProfileData();

  const tabParam = searchParams.get('tab') as ProfileTab | null;
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  const setActiveTab = useCallback((tab: ProfileTab) => {
    if (tab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  }, [setSearchParams]);

  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);
  const [playerRankings, setPlayerRankings] = useState<any[]>([]);
  const [favoriteGame, setFavoriteGame] = useState<Game | null>(() => {
    if (!user?.favorite_game_id) return null;
    try {
      const cached = localStorage.getItem('favorite_game_cache');
      if (cached) {
        const { gameId, gameName } = JSON.parse(cached);
        if (gameId === user.favorite_game_id) {
          return { id: gameId, name: gameName } as Game;
        }
      }
    } catch { /* ignore */ }
    return null;
  });

  useEffect(() => {
    const loadFavoriteGame = async () => {
      if (!user?.favorite_game_id) {
        setFavoriteGame(null);
        localStorage.removeItem('favorite_game_cache');
        return;
      }
      try {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('id', user.favorite_game_id)
          .maybeSingle();
        if (data) {
          setFavoriteGame(data);
          localStorage.setItem('favorite_game_cache', JSON.stringify({
            gameId: data.id,
            gameName: data.name
          }));
        }
      } catch (error) {
        console.error('Error loading favorite game:', error);
      }
    };
    loadFavoriteGame();
  }, [user?.favorite_game_id]);

  const { primaryGame, theme } = usePlayerPrimaryGame({
    playerRankings: userProfile?.player_rankings || playerRankings,
    registrations: registrations,
    gamingAccounts: gamingAccounts,
    favoriteGameId: user?.favorite_game_id || null,
    favoriteGameName: favoriteGame?.name || null
  });

  useEffect(() => {
    const loadAchievements = async () => {
      if (!user?.id) return;
      try {
        setIsLoadingAchievements(true);
        const { data: allAchievements } = await supabase
          .from('achievements')
          .select('*');
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id);
        const unlockedMap = new Map(
          userAchievements?.map((ua) => [ua.achievement_id, ua.unlocked_at]) || []
        );
        const merged = (allAchievements || []).map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon || 'trophy',
          category: a.category || 'milestone',
          xp_reward: a.xp_reward || 0,
          rarity: (a.rarity || 'common') as Achievement['rarity'],
          unlocked: unlockedMap.has(a.id),
          unlocked_at: unlockedMap.get(a.id)
        }));
        setAchievements(merged);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoadingAchievements(false);
      }
    };

    const loadPlayerRankings = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('player_rankings')
          .select(`id, elo_rating, wins, losses, rank_tier, games:game_id (id, name)`)
          .eq('user_id', user.id);
        setPlayerRankings(data || []);
      } catch (error) {
        console.error('Error loading player rankings:', error);
      }
    };

    loadAchievements();
    loadPlayerRankings();
  }, [user?.id]);

  const stats = useMemo(() => {
    const tournamentsPlayed = registrations.length;
    let wins = 0;
    let losses = 0;
    playerRankings.forEach((r) => {
      wins += r.wins || 0;
      losses += r.losses || 0;
    });
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    return {
      tournamentsPlayed,
      winRate,
      friendsCount: friends.length,
      connectedAccounts: gamingAccounts.length,
      validatedAccounts: gamingAccounts.filter((a) => a.is_validated).length
    };
  }, [registrations, friends, gamingAccounts, playerRankings]);

  const xp = useMemo(() => {
    return calculateXpFromActivity(
      stats.tournamentsPlayed,
      0,
      stats.validatedAccounts,
      user?.is_profile_completed || false,
      stats.friendsCount
    );
  }, [stats, user?.is_profile_completed]);

  const activeTournament = useMemo(() => {
    const now = new Date();
    return registrations.find((reg) => {
      const t = reg.tournament;
      if (!t) return false;
      if (t.status === 'ongoing') return true;
      const start = t.startDate ? new Date(t.startDate) : null;
      const end = t.endDate ? new Date(t.endDate) : null;
      return start && end && now >= start && now <= end;
    }) || null;
  }, [registrations]);

  const upcomingTournament = useMemo(() => {
    const now = new Date();
    return registrations
      .filter((reg) => {
        const t = reg.tournament;
        if (!t) return false;
        const start = t.startDate ? new Date(t.startDate) : null;
        return start && now < start;
      })
      .sort((a, b) => {
        const dateA = a.tournament?.startDate ? new Date(a.tournament.startDate).getTime() : 0;
        const dateB = b.tournament?.startDate ? new Date(b.tournament.startDate).getTime() : 0;
        return dateA - dateB;
      })[0] || null;
  }, [registrations]);

  return (
    <div
      className="min-h-screen pt-20 pb-16"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.primary}08 0%, transparent 30%)`
      }}
    >
      <ProfileHeroBanner
        user={user}
        theme={theme}
        primaryGameName={primaryGame}
        xp={xp}
        stats={stats}
        onPreviewClick={() => {
          if (user?.id) {
            setSelectedPlayerId(user.id);
            setIsPlayerProfileModalOpen(true);
          }
        }}
      />

      <div
        className="sticky top-16 z-30 backdrop-blur-md border-b border-gray-800/80"
        style={{ backgroundColor: 'rgba(17, 24, 39, 0.85)' }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <ProfileTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            theme={theme}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ProfileSetupWidget
              user={user}
              theme={theme}
              onStartSetup={() => setIsSetupModalOpen(true)}
            />
            {(activeTournament || upcomingTournament) && (
              <ActiveTournamentCard
                activeTournament={activeTournament}
                upcomingTournament={upcomingTournament}
                theme={theme}
              />
            )}

            <ProfileQuestProgress theme={theme} />

            <ProfileGamingStatsCard
              stats={stats}
              playerRankings={playerRankings}
              theme={theme}
              xp={xp}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileThemeCard
                theme={theme}
                primaryGameName={primaryGame}
                favoriteGame={favoriteGame}
              />
              <ProfileSocialLinksCard
                user={user}
                theme={theme}
              />
            </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <ActiveTournamentCard
              activeTournament={activeTournament}
              upcomingTournament={upcomingTournament}
              theme={theme}
            />
            <ProfileTournamentHub
              registrations={registrations}
              theme={theme}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <ProfileStatsTab
            playerRankings={playerRankings}
            theme={theme}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'friends' && (
          <ProfileFriendsRow
            friends={friends}
            theme={theme}
            isLoading={isLoadingFriends}
            maxVisible={20}
          />
        )}

        {activeTab === 'achievements' && (
          <ProfileAchievementsGrid
            achievements={achievements}
            theme={theme}
            isLoading={isLoadingAchievements}
          />
        )}
      </div>

      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
      />

      <ProfileSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        user={user}
        theme={theme}
      />
    </div>
  );
};

export default ProfilePage;
