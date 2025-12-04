import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchGames } from '../services/api';
import { Award, ArrowRight, Search, Filter, X, Grid, List } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  publisher: string;
  image_url: string;
}

const LeaderboardsPage: React.FC = () => {
  const { t } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<string | null>(null);
  const [publishers, setPublishers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGames();
        setGames(data);

        // Extract unique publishers
        const uniquePublishers = Array.from(new Set(data.map(game => game.publisher))).sort();
        setPublishers(uniquePublishers);
      } catch (error) {
        console.error('Error loading games:', error);
        setGames([]);
        setPublishers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, []);

  // Filter games based on search query and selected publisher
  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.publisher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPublisher = selectedPublisher ? game.publisher === selectedPublisher : true;
    return matchesSearch && matchesPublisher;
  });

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              <span className="gradient-text">{t('leaderboards.pageTitle')}</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              {t('leaderboards.pageSubtitle')}
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t('leaderboards.searchPlaceholder')}
                  className="input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Publisher Filter */}
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  className="input bg-white dark:bg-dark-200 border-gray-300 dark:border-gray-700 w-full md:w-auto"
                  value={selectedPublisher || ''}
                  onChange={(e) => setSelectedPublisher(e.target.value || null)}
                >
                  <option value="">{t('leaderboards.allPublishers')}</option>
                  {publishers.map(publisher => (
                    <option key={publisher} value={publisher}>{publisher}</option>
                  ))}
                </select>

                {selectedPublisher && (
                  <button
                    onClick={() => setSelectedPublisher(null)}
                    className="p-2 bg-dark-200 rounded-full hover:bg-dark-300 transition-colors"
                    aria-label={t('leaderboards.clearFilter')}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-dark-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                aria-label={t('leaderboards.gridView')}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                aria-label={t('leaderboards.listView')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="animate-pulse bg-dark-100 rounded-lg overflow-hidden">
                    <div className="w-full aspect-square bg-dark-300"></div>
                    <div className="p-3">
                      <div className="h-4 bg-dark-300 rounded mb-2"></div>
                      <div className="h-3 w-2/3 bg-dark-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="animate-pulse bg-dark-100 rounded-lg p-3 flex items-center">
                    <div className="w-12 h-12 bg-dark-300 rounded-lg mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-dark-300 rounded mb-2 w-1/3"></div>
                      <div className="h-3 bg-dark-300 rounded w-1/4"></div>
                    </div>
                    <div className="w-6 h-6 bg-dark-300 rounded-full"></div>
                  </div>
                ))}
              </div>
            )
          ) : filteredGames.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredGames.map((game) => (
                  <Link
                    key={game.id}
                    to={`/leaderboards/${game.id}`}
                    className="bg-dark-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] group"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <div className="w-full aspect-square overflow-hidden relative">
                      <img
                        src={game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                        alt={game.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="w-full p-2 text-center">
                          <span className="text-xs text-primary-300 bg-dark-300/80 px-2 py-1 rounded-full">
                            {t('leaderboards.viewLeaderboard')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{game.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{game.publisher}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGames.map((game) => (
                  <Link
                    key={game.id}
                    to={`/leaderboards/${game.id}`}
                    className="flex items-center p-3 bg-dark-100 rounded-lg hover:bg-dark-200 transition-colors"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                      <img
                        src={game.image_url || 'https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{game.name}</h3>
                      <p className="text-sm text-gray-400">{game.publisher}</p>
                    </div>
                    <Award className="text-primary-500 h-5 w-5 mr-2" />
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">
                {games.length === 0 ? t('leaderboards.noGamesAvailable') : t('leaderboards.noGamesFound')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {games.length === 0
                  ? t('leaderboards.noGamesAvailableDescription')
                  : t('leaderboards.tryDifferentSearch')
                }
              </p>
            </div>
          )}

          <div className="mt-12 p-6 bg-dark-100 rounded-xl">
            <h2 className="font-heading font-semibold text-xl mb-4 text-gray-900 dark:text-white">
              {t('leaderboards.howLeaderboardsWork')}
            </h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                {t('leaderboards.howLeaderboardsWorkDescription')}
              </p>
              <ul className="list-disc pl-5 text-gray-300 space-y-2">
                <li>
                  <span className="text-primary-500 font-medium">{t('leaderboards.finalPlacement')}</span> - {t('leaderboards.finalPlacementDescription')}
                </li>
                <li>
                  <span className="text-primary-500 font-medium">{t('leaderboards.individualPerformance')}</span> - {t('leaderboards.individualPerformanceDescription')}
                </li>
                <li>
                  <span className="text-primary-500 font-medium">{t('leaderboards.tournamentLevel')}</span> - {t('leaderboards.tournamentLevelDescription')}
                </li>
                <li>
                  <span className="text-primary-500 font-medium">{t('leaderboards.consistency')}</span> - {t('leaderboards.consistencyDescription')}
                </li>
              </ul>
              <p className="text-gray-300">
                {t('leaderboards.leaderboardsUpdateInfo')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage;
