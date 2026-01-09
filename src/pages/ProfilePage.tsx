import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileData } from '../hooks/useProfileData';
import { useProfileVisibility } from '../hooks/useProfileVisibility';
import { usePlayerPrimaryGame, calculateXpFromActivity } from '../hooks/usePlayerPrimaryGame';
import { supabase } from '../lib/supabase';
import { Game } from '../types';
import ProfileHeroBanner from '../components/profile/ProfileHeroBanner';
import ActiveTournamentCard from '../components/profile/ActiveTournamentCard';
import ProfileTournamentHub from '../components/profile/ProfileTournamentHub';
import ProfileFriendsRow from '../components/profile/ProfileFriendsRow';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import AchievementBadgesRow from '../components/profile/AchievementBadgesRow';
import PlayerProfileModal from '../components/ui/PlayerProfileModal';

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

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const {
    user,
    userProfile,
    registrations,
    friends,
    tickets,
    gamingAccounts,
    isLoading,
    isLoadingFriends,
    isLoadingTickets
  } = useProfileData();

  const {
    isProfilePublic,
    isUpdatingVisibility,
    handleVisibilityToggle
  } = useProfileVisibility();

  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
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
    } catch {
    }
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
        const cached = localStorage.getItem('favorite_game_cache');
        if (cached) {
          const { gameId, gameName } = JSON.parse(cached);
          if (gameId === user.favorite_game_id && !favoriteGame) {
            setFavoriteGame({ id: gameId, name: gameName } as Game);
          }
        }

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

  const { primaryGame, theme, gameActivities } = usePlayerPrimaryGame({
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

        const mergedAchievements = (allAchievements || []).map((achievement) => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon || 'trophy',
          category: achievement.category || 'milestone',
          xp_reward: achievement.xp_reward || 0,
          rarity: (achievement.rarity || 'common') as Achievement['rarity'],
          unlocked: unlockedMap.has(achievement.id),
          unlocked_at: unlockedMap.get(achievement.id)
        }));

        setAchievements(mergedAchievements);
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
          .select(`
            id,
            elo_rating,
            wins,
            losses,
            rank_tier,
            games:game_id (id, name)
          `)
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
    const validatedAccounts = gamingAccounts.filter((a) => a.is_validated).length;
    const tournamentsPlayed = registrations.length;

    let wins = 0;
    let losses = 0;
    playerRankings.forEach((ranking) => {
      wins += ranking.wins || 0;
      losses += ranking.losses || 0;
    });
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return {
      tournamentsPlayed,
      winRate,
      friendsCount: friends.length,
      connectedAccounts: gamingAccounts.length,
      validatedAccounts
    };
  }, [registrations, friends, gamingAccounts, playerRankings]);

  const xp = useMemo(() => {
    const tournamentsWon = 0;
    return calculateXpFromActivity(
      stats.tournamentsPlayed,
      tournamentsWon,
      stats.validatedAccounts,
      user?.is_profile_completed || false,
      stats.friendsCount
    );
  }, [stats, user?.is_profile_completed]);

  const activeTournament = useMemo(() => {
    const now = new Date();
    return registrations.find((reg) => {
      const tournament = reg.tournament;
      if (!tournament) return false;
      if (tournament.status === 'ongoing') return true;
      const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
      const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
      return startDate && endDate && now >= startDate && now <= endDate;
    }) || null;
  }, [registrations]);

  const upcomingTournament = useMemo(() => {
    const now = new Date();
    return registrations
      .filter((reg) => {
        const tournament = reg.tournament;
        if (!tournament) return false;
        const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
        return startDate && now < startDate;
      })
      .sort((a, b) => {
        const dateA = a.tournament?.startDate ? new Date(a.tournament.startDate).getTime() : 0;
        const dateB = b.tournament?.startDate ? new Date(b.tournament.startDate).getTime() : 0;
        return dateA - dateB;
      })[0] || null;
  }, [registrations]);

  const openTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'open' || t.status === 'pending').length;
  }, [tickets]);

  return (
    <div
      className="min-h-screen pt-28 pb-16"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.primary}08 0%, transparent 30%)`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
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

          <div className="mt-6">
            <AchievementBadgesRow
              achievements={achievements}
              theme={theme}
              isLoading={isLoadingAchievements}
            />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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

              <ProfileFriendsRow
                friends={friends}
                theme={theme}
                isLoading={isLoadingFriends}
              />
            </div>

            <div className="lg:col-span-1">
              <ProfileSidebar
                gamingAccounts={gamingAccounts}
                playerRankings={playerRankings}
                theme={theme}
                isProfilePublic={isProfilePublic}
                isUpdatingVisibility={isUpdatingVisibility}
                onVisibilityToggle={handleVisibilityToggle}
                ticketCount={openTicketsCount}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <PlayerProfileModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => setIsPlayerProfileModalOpen(false)}
        userId={selectedPlayerId}
      />
    </div>
  );
};

export default ProfilePage;
