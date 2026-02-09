import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTournaments, fetchGames, extractTwitchChannelName } from '../services/api';
import { Tournament } from '../types';
import TournamentList from '../components/tournaments/TournamentList';
import MobileGameGrid from '../components/games/MobileGameGrid';
import GameLibrarySidebar from '../components/games/GameLibrarySidebar';
import { HeroSection } from '../components/home/HeroSection';
import { X, Video, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import { calculateTournamentStatus } from '../utils/tournamentUtils';
import WhitelistBadge from '../components/ui/WhitelistBadge';
import OnboardingWalkthrough from '../components/onboarding/OnboardingWalkthrough';

const HomePage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [gameFilterName, setGameFilterName] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [isLiveTournamentsOpen, setIsLiveTournamentsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visitorCountry, setVisitorCountry] = useState<string | null>(null);
  const [isLoadingCountry, setIsLoadingCountry] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);
  const slidesPerView = isMobile ? 1 : 3;
  const totalSlides = Math.ceil(liveTournaments.length / slidesPerView);

  const { user } = useAuth();
  const { configId, brandName } = useAppConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check if we're on mobile and sidebar visibility
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Detect visitor country and whitelist status
  useEffect(() => {
    const detectVisitorCountry = async () => {
      try {
        setIsLoadingCountry(true);
        setVisitorCountry(null);
        setIsWhitelisted(false);
      } catch (error) {
        console.error('[HomePage] Error detecting country:', error);
        setVisitorCountry(null);
        setIsWhitelisted(false);
      } finally {
        setIsLoadingCountry(false);
      }
    };

    // Only detect country if user is not authenticated
    // If user is authenticated, we use their stored country from the database
    if (!user) {
      detectVisitorCountry();
    } else {
      setIsLoadingCountry(false);
    }
  }, [user]);

  // Setup slideshow for live tournaments
  useEffect(() => {
    // Clear any existing interval
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
      slideInterval.current = null;
    }

    // Only start slideshow if we have more than slidesPerView tournaments
    if (liveTournaments.length > slidesPerView) {
      slideInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % totalSlides);
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [liveTournaments.length, totalSlides, slidesPerView]);

  // Function to filter tournaments by country (user or visitor)
  const filterByCountry = (tournamentsToFilter: Tournament[]): Tournament[] => {
    // If user is whitelisted, return ALL tournaments without filtering
    if (isWhitelisted) {
      console.debug('[HomePage] User is whitelisted - showing all tournaments');
      return tournamentsToFilter;
    }

    // Use authenticated user's country first, otherwise use detected visitor country
    const countryCode = user?.country || visitorCountry;

    // If no country detected at all, show all tournaments
    if (!countryCode) {
      console.debug('[HomePage] No country detected, showing all tournaments');
      return tournamentsToFilter;
    }

    return tournamentsToFilter.filter(tournament => {
      // If no eligible countries specified, tournament is available to everyone
      if (!tournament.eligible_countries) {
        return true;
      }

      // Parse the eligible countries and check if country is included
      const eligibleCountries = tournament.eligible_countries.split(',').map(c => c.trim());

      // Log for debugging
      console.debug(`Tournament ${tournament.id} eligible countries: ${tournament.eligible_countries}`);
      console.debug(`Country code: ${countryCode} (${user ? 'authenticated' : 'visitor'})`);
      console.debug(`Is eligible: ${eligibleCountries.includes(countryCode)}`);

      return eligibleCountries.includes(countryCode);
    });
  };

  // Handle URL parameters for game filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gameParam = params.get('game');

    if (gameParam && gameParam !== selectedGameId) {
      setSelectedGameId(gameParam);
    }
  }, [location.search, selectedGameId]);

  // Load all tournaments initially
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTournaments();
        console.debug('All tournaments:', data);
        setTournaments(data);

        // Apply country filtering by default
        const filtered = filterByCountry(data);
        console.debug('Country filtered tournaments:', filtered);
        setFilteredTournaments(filtered);

        setError(null);
      } catch (err) {
        setError(t('home.errorLoadingTournaments'));
        console.error(err);
        setTournaments([]);
        setFilteredTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, [user?.country, visitorCountry]); // Re-run when user's country or visitor country changes

  // Load games for mapping game IDs to names
  useEffect(() => {
    const loadGames = async () => {
      try {
        console.log('[HomePage] Loading games...');
        const data = await fetchGames();
        console.log('[HomePage] Games loaded:', data?.length || 0);
        setGames(data || []);
      } catch (error) {
        console.error('[HomePage] Error loading games:', error);
        // Set empty array on error to prevent crashes
        setGames([]);
      }
    };

    loadGames();
  }, []);

  // When a game is selected, update the game filter name and filter tournaments
  useEffect(() => {
    if (selectedGameId) {
      const selectedGame = games.find(game => game.id === selectedGameId);
      if (selectedGame) {
        setGameFilterName(selectedGame.name);
      }

      // Filter tournaments by the selected game
      const gameFilteredTournaments = tournaments.filter(tournament => {
        return tournament.game_id === selectedGameId;
      });

      // Apply country filtering to the game-filtered tournaments
      const filtered = filterByCountry(gameFilteredTournaments);
      setFilteredTournaments(filtered);
    } else {
      setGameFilterName(null);
      // Reset to all tournaments with country filter
      const filtered = filterByCountry(tournaments);
      setFilteredTournaments(filtered);
    }
  }, [selectedGameId, games, tournaments, user?.country, visitorCountry, isWhitelisted]);

  // Check which tournaments have live streams
  useEffect(() => {
    const filterLiveTournaments = () => {
      if (tournaments.length === 0) return;

      try {
        // Filter tournaments that are ongoing AND have live Twitch streams
        const liveTournaments = tournaments.filter(tournament => {
          const calculatedStatus = calculateTournamentStatus(tournament);
          return calculatedStatus === 'ongoing' &&
                 tournament.twitch_url &&
                 tournament.is_twitch_live;
        });

        setLiveTournaments(liveTournaments);

        // Auto-open the live tournaments section if there are any
        if (liveTournaments.length > 0) {
          setIsLiveTournamentsOpen(true);
        }
      } catch (error) {
        console.error('Error checking live tournaments:', error);
        setLiveTournaments([]);
      }
    };

    filterLiveTournaments();
  }, [tournaments]);

  const handleGameSelect = (gameId: string | null) => {
    setSelectedGameId(gameId);
    // Reset SQL query when changing selection
    setSqlQuery(null);
  };

  const handleGameFilterClear = () => {
    setSelectedGameId(null);
    setGameFilterName(null);
    setSqlQuery(null);
  };

  // Toggle live tournaments dropdown
  const toggleLiveTournaments = () => {
    setIsLiveTournamentsOpen(!isLiveTournamentsOpen);
  };

  // Navigate to previous slide
  const goToPrevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  // Navigate to next slide
  const goToNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  // Get visible tournaments for current slide
  const getVisibleTournaments = () => {
    const startIndex = currentSlide * slidesPerView;
    return liveTournaments.slice(startIndex, startIndex + slidesPerView);
  };

  const scrollToTournaments = () => {
    const tournamentsSection = document.getElementById('tournaments');
    if (tournamentsSection) {
      const headerOffset = 80;
      const elementPosition = tournamentsSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToLiveTournaments = () => {
    const liveSection = document.getElementById('live-tournaments');
    if (liveSection) {
      const headerOffset = 80;
      const elementPosition = liveSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      scrollToTournaments();
    }
  };

  const navigateToGameHub = () => {
    navigate('/hub');
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {showSidebar && (
        <GameLibrarySidebar />
      )}

      <div className={`flex-1 transition-all duration-300 w-full overflow-x-hidden ${showSidebar ? 'ml-[72px]' : 'ml-0'}`}>
        <HeroSection
          activeTournamentsCount={filteredTournaments.filter(tournament => {
            const now = new Date();
            const endDate = new Date(tournament.endDate);
            return now <= endDate;
          }).length}
          gamesCount={games.length}
          liveTournamentsCount={liveTournaments.filter(tournament => {
            const now = new Date();
            const endDate = new Date(tournament.endDate);
            if (!user?.country || !tournament.eligible_countries) return true;
            const eligibleCountries = tournament.eligible_countries.split(',').map(c => c.trim());
            return eligibleCountries.includes(user.country) && now <= endDate;
          }).length}
          isMobile={isMobile}
          onViewTournaments={scrollToTournaments}
          onBrowseGames={navigateToGameHub}
          onWatchLive={scrollToLiveTournaments}
        />

        {/* Mobile Game Grid - Only show on mobile */}
        {isMobile && (
          <div id="walkthrough-game-hub">
            <MobileGameGrid />
          </div>
        )}

        {/* Live Tournaments Section - Only show when there are live tournaments */}
        {liveTournaments.length > 0 && (
          <section id="live-tournaments" className="py-6 sm:py-8 md:py-10 bg-gradient-to-r from-red-900/20 to-dark-200/20 overflow-hidden">
            <div className="container mx-auto px-4 max-w-full">
              <div
                className="flex items-center justify-between mb-4 sm:mb-6 cursor-pointer"
                onClick={toggleLiveTournaments}
              >
                <div className="flex items-center">
                  <Video className="text-red-500 h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold flex items-center">
                    <span>
                      {t('home.liveTournaments', {
                        count: liveTournaments.filter(tournament => {
                          const now = new Date();
                          const endDate = new Date(tournament.endDate);
                          if (!user?.country || !tournament.eligible_countries) return true;
                          const eligibleCountries = tournament.eligible_countries.split(',').map(c => c.trim());
                          return eligibleCountries.includes(user.country) && now <= endDate;
                        }).length
                      })}
                    </span>
                    <span className="w-2 h-2 bg-red-500 rounded-full ml-2 animate-pulse"></span>
                  </h2>
                </div>
                <div className="bg-dark-200/50 p-2 rounded-full">
                  {isLiveTournamentsOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {isLiveTournamentsOpen && (
                <>
                  {/* Slideshow for more than 3 tournaments */}
                  {liveTournaments.length > slidesPerView ? (
                    <div className="relative">
                      {/* Navigation arrows */}
                      <button
                        onClick={goToPrevSlide}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-dark-100/80 p-2 rounded-full text-white hover:bg-dark-100 transition-colors"
                        aria-label={t('home.slideNavigation.previousSlide')}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>

                      <div className="overflow-hidden">
                        <div
                          className="flex transition-transform duration-500 ease-in-out"
                          style={{ transform: `translateX(-${currentSlide * (100 / totalSlides)}%)` }}
                        >
                          {liveTournaments.map(tournament => (
                            <div
                              key={tournament.id}
                              className={`${isMobile ? 'w-full' : 'w-1/3'} flex-shrink-0 px-3`}
                            >
                              <Link
                                to={`/stream/${extractTwitchChannelName(tournament.twitch_url || '')}`}
                                className="block bg-dark-100 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group border border-red-500/30 h-full"
                              >
                                <div className="relative h-40 overflow-hidden">
                                  <img
                                    src={tournament.header_url || tournament.image || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                                    alt={tournament.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-transparent to-transparent"></div>
                                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></span>
                                    {t('home.live')}
                                  </div>
                                  <div className="absolute bottom-2 left-2">
                                    <h3 className="font-medium text-white text-lg">{tournament.title}</h3>
                                    <p className="text-sm text-gray-300">{tournament.game}</p>
                                  </div>
                                  <div className="absolute inset-0 bg-dark-100/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center">
                                      <Video className="h-4 w-4 mr-2" />
                                      <span>{t('home.watchOnPlatform')}</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={goToNextSlide}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-dark-100/80 p-2 rounded-full text-white hover:bg-dark-100 transition-colors"
                        aria-label={t('home.slideNavigation.nextSlide')}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>

                      {/* Slide indicators */}
                      <div className="flex justify-center mt-4 space-x-2">
                        {Array.from({ length: totalSlides }).map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              currentSlide === index ? 'bg-red-500' : 'bg-gray-600'
                            }`}
                            aria-label={t('home.slideNavigation.goToSlide', { number: index + 1 })}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Regular grid for 3 or fewer tournaments
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {liveTournaments.map(tournament => (
                        <Link
                          key={tournament.id}
                          to={`/stream/${extractTwitchChannelName(tournament.twitch_url || '')}`}
                          className="bg-dark-100 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group border border-red-500/30"
                        >
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={tournament.header_url || tournament.image || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                              alt={tournament.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-transparent to-transparent"></div>
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></span>
                              {t('home.live')}
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <h3 className="font-medium text-white text-lg">{tournament.title}</h3>
                              <p className="text-sm text-gray-300">{tournament.game}</p>
                            </div>
                            <div className="absolute inset-0 bg-dark-100/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center">
                                <Video className="h-4 w-4 mr-2" />
                                <span>{t('home.watchOnPlatform')}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Tournament listing section */}
        <section id="walkthrough-tournaments" className="py-8 sm:py-12 md:py-16 overflow-hidden">
          <div id="tournaments" className="container mx-auto px-4 max-w-full">
            {error && (
              <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {isWhitelisted ? (
              <div className="mb-4 sm:mb-6 px-2">
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <WhitelistBadge size="lg" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-400 dark:text-amber-300 text-base sm:text-lg mb-1">
                        {t('home.whitelistAccess')}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-400">
                        {t('home.whitelistMessage')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : configId !== 'default' ? (
              <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-400 px-2">
                <span>{t('home.brandFilter', { brandName })}</span>
              </div>
            ) : (user?.country || visitorCountry) ? (
              <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-400 px-2">
                {user?.country ? (
                  <span>{t('home.countryFilter', { country: user.country })}</span>
                ) : visitorCountry ? (
                  <span>{t('home.regionFilter', { country: visitorCountry })}</span>
                ) : null}
              </div>
            ) : null}

            {isLoadingCountry && !user && (
              <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-500 px-2 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                {t('home.detectingCountry')}
              </div>
            )}

            <TournamentList
              tournaments={filteredTournaments}
              isLoading={isLoading}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedGameId={selectedGameId}
              onGameFilterClear={handleGameFilterClear}
              gameFilterName={gameFilterName}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </section>
      </div>

      <OnboardingWalkthrough pageName="home" />
    </div>
  );
};

export default HomePage;
