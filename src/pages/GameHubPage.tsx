import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfigGames } from '../hooks/useConfigGames';
import { ConfigGame } from '../services/configGamesService';
import { fetchRubricsForGame, isOthersGame, RubricInfo } from '../services/othersService';
import { getGameTheme } from '../utils/gameThemes';
import GameHubCarousel from '../components/games/GameHubCarousel';
import GameHubTabs, { GameHubTabId } from '../components/games/GameHubTabs';
import GameHubOverviewTab from '../components/games/tabs/GameHubOverviewTab';
import GameHubTournamentsTab from '../components/games/tabs/GameHubTournamentsTab';
import GameHubLeaderboardTab from '../components/games/tabs/GameHubLeaderboardTab';
import GameHubTrainingTab from '../components/games/tabs/GameHubTrainingTab';
import GameHubSkillLabTab from '../components/games/tabs/GameHubSkillLabTab';
import GameHubCoachingTab from '../components/games/tabs/GameHubCoachingTab';
import OthersHubDynamicTabs from '../components/others/OthersHubDynamicTabs';
import OthersRubricContentTab from '../components/others/OthersRubricContentTab';
import OthersArticlesTab from '../components/others/OthersArticlesTab';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import OnboardingWalkthrough from '../components/onboarding/OnboardingWalkthrough';

const GameHubPage: React.FC = () => {
  const { gameSlug } = useParams<{ gameSlug?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { games: configGames, isLoading: configLoading } = useConfigGames();
  const [selectedGame, setSelectedGame] = useState<ConfigGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GameHubTabId>('overview');
  const [rubrics, setRubrics] = useState<RubricInfo[]>([]);
  const [othersActiveTab, setOthersActiveTab] = useState<string>('');
  const [rubricsLoading, setRubricsLoading] = useState(false);

  useEffect(() => {
    if (configLoading || configGames.length === 0) return;

    const resolveGame = async () => {
      try {
        setError(null);

        if (!gameSlug) {
          navigate(`/hub/${configGames[0].slug}`, { replace: true });
          return;
        }

        if (selectedGame?.slug === gameSlug) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        const match = configGames.find((g) => g.slug === gameSlug);
        if (!match) {
          navigate(`/hub/${configGames[0].slug}`, { replace: true });
          return;
        }

        setSelectedGame(match);
        setActiveTab('overview');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (isOthersGame(match)) {
          setRubricsLoading(true);
          try {
            const gameRubrics = await fetchRubricsForGame(match.id);
            setRubrics(gameRubrics);
            if (gameRubrics.length > 0) {
              setOthersActiveTab(gameRubrics[0].rubric_id);
            } else {
              setOthersActiveTab('articles');
            }
          } catch (rubricErr) {
            console.error('Error loading rubrics:', rubricErr);
            setOthersActiveTab('articles');
          } finally {
            setRubricsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error loading game:', err);
        setError(t('gameHub.errorLoadingGame'));
      }
    };

    resolveGame();
  }, [gameSlug, configGames, configLoading, navigate, t]);

  const isLoading = configLoading || (configGames.length > 0 && !selectedGame && !error);

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

  const theme = selectedGame ? getGameTheme(selectedGame.slug || selectedGame.name) : null;
  const isCollectionGame = selectedGame ? isOthersGame(selectedGame) : false;

  const renderOthersTabContent = () => {
    if (!selectedGame || !theme) return null;

    if (othersActiveTab === 'articles') {
      return <OthersArticlesTab theme={theme} />;
    }

    const activeRubric = rubrics.find((r) => r.rubric_id === othersActiveTab);
    if (activeRubric) {
      return (
        <OthersRubricContentTab
          gameId={selectedGame.id}
          rubricId={activeRubric.rubric_id}
          rubricName={activeRubric.rubric_name || activeRubric.rubric_id}
          theme={theme}
        />
      );
    }

    return null;
  };

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
              {isCollectionGame ? (
                <OthersHubDynamicTabs
                  rubrics={rubrics}
                  activeTab={othersActiveTab}
                  onTabChange={setOthersActiveTab}
                  theme={theme}
                  isLoading={rubricsLoading}
                />
              ) : (
                <GameHubTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  theme={theme}
                />
              )}
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
                {isCollectionGame ? renderOthersTabContent() : renderTabContent()}
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
