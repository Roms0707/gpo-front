import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchGames, fetchGameBySlug } from '../services/api';
import { getGameTheme } from '../utils/gameThemes';
import GameHubCarousel from '../components/games/GameHubCarousel';
import GameHubTabs, { GameHubTabId } from '../components/games/GameHubTabs';
import GameHubOverviewTab from '../components/games/tabs/GameHubOverviewTab';
import GameHubTournamentsTab from '../components/games/tabs/GameHubTournamentsTab';
import GameHubLeaderboardTab from '../components/games/tabs/GameHubLeaderboardTab';
import GameHubTrainingTab from '../components/games/tabs/GameHubTrainingTab';
import GameHubSkillLabTab from '../components/games/tabs/GameHubSkillLabTab';
import GameHubCoachingTab from '../components/games/tabs/GameHubCoachingTab';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import OnboardingWalkthrough from '../components/onboarding/OnboardingWalkthrough';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
  slug: string;
  twitch_cover_url?: string;
}

const GameHubPage: React.FC = () => {
  const { gameSlug } = useParams<{ gameSlug?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GameHubTabId>('overview');

  useEffect(() => {
    const loadGame = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (gameSlug) {
          if (selectedGame?.slug === gameSlug) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsLoading(false);
            return;
          }
          const game = await fetchGameBySlug(gameSlug);
          setSelectedGame(game);
          setActiveTab('overview');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const games = await fetchGames();
          if (games && games.length > 0) {
            setSelectedGame(games[0]);
            navigate(`/hub/${games[0].slug}`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Error loading game:', err);
        setError(t('gameHub.errorLoadingGame'));
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();
  }, [gameSlug, navigate, t]);

  const handleGameSelect = (newGameSlug: string) => {
    setActiveTab('overview');
    navigate(`/hub/${newGameSlug}`);
  };

  const handleTabChange = (tab: GameHubTabId) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('gameHub.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-100 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  const theme = selectedGame ? getGameTheme(selectedGame.name) : null;

  const renderTabContent = () => {
    if (!selectedGame || !theme) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <GameHubOverviewTab
            gameId={selectedGame.id}
            gameName={selectedGame.name}
            theme={theme}
            onNavigateToTab={handleTabChange}
          />
        );
      case 'tournaments':
        return (
          <GameHubTournamentsTab
            gameId={selectedGame.id}
            gameName={selectedGame.name}
            theme={theme}
          />
        );
      case 'leaderboard':
        return (
          <GameHubLeaderboardTab
            gameId={selectedGame.id}
            gameName={selectedGame.name}
            theme={theme}
          />
        );
      case 'training':
        return (
          <GameHubTrainingTab
            gameId={selectedGame.id}
            gameName={selectedGame.name}
            theme={theme}
          />
        );
      case 'skillLab':
        return (
          <GameHubSkillLabTab
            gameId={selectedGame.id}
            gameName={selectedGame.name}
            theme={theme}
          />
        );
      case 'coaching':
        return (
          <GameHubCoachingTab
            gameId={selectedGame.id}
            gameName={selectedGame.name}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-100">
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: theme
            ? `radial-gradient(ellipse at top, ${theme.colors.primary}08 0%, transparent 50%)`
            : undefined,
        }}
      />

      <div className="relative z-10">
        <GameHubCarousel
          selectedGameId={selectedGame?.id}
          onGameSelect={handleGameSelect}
        />

        {selectedGame && theme && (
          <>
            <div className="sticky top-0 z-20">
              <GameHubTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                theme={theme}
              />
            </div>

            <div className="relative">
              <div
                className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                style={{
                  background: theme
                    ? `linear-gradient(to bottom, ${theme.colors.primary}10, transparent)`
                    : undefined,
                }}
              />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderTabContent()}
              </div>
            </div>
          </>
        )}
      </div>

      <OnboardingWalkthrough pageName="gameHub" />
    </div>
  );
};

export default GameHubPage;
