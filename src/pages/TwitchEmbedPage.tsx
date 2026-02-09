import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Users, Calendar, Trophy, Volume2, VolumeX, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { extractTwitchChannelName } from '../services/api';
import { formatDate } from '../utils/formatters';

interface Tournament {
  id: string;
  title: string;
  game: string;
  start_date: string;
  end_date: string;
  main_prize: string;
  twitch_url: string;
  header_url: string;
  description: string;
}

const TwitchEmbedPage: React.FC = () => {
  const { channelName } = useParams<{ channelName: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<'loading' | 'online' | 'offline'>('online');
  const [lastStatusCheck, setLastStatusCheck] = useState<Date>(new Date());
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (channelName) {
      loadTournamentData();
      checkTwitchStreamStatus();

      statusCheckIntervalRef.current = setInterval(() => {
        checkTwitchStreamStatus();
      }, 30000);
    }

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, [channelName]);

  const checkTwitchStreamStatus = async () => {
    if (!channelName) return;

    try {
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('is_twitch_live')
        .ilike('twitch_url', `%${channelName}%`)
        .single();

      if (tournamentData) {
        setStreamStatus(tournamentData.is_twitch_live ? 'online' : 'offline');
      }

      setLastStatusCheck(new Date());
    } catch (error) {
      console.error('Error checking stream status:', error);
      setStreamStatus('online');
      setLastStatusCheck(new Date());
    }
  };

  const loadTournamentData = async () => {
    if (!channelName) return;

    try {
      setIsLoading(true);

      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          title,
          description,
          type,
          start_date,
          end_date,
          main_prize,
          twitch_url,
          header_url
        `)
        .ilike('twitch_url', `%${channelName}%`)
        .order('start_date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading tournament:', error);
        setError('Erreur lors du chargement du tournoi');
        return;
      }

      if (tournaments && tournaments.length > 0) {
        const tournamentData = tournaments[0];
        setTournament({
          id: tournamentData.id,
          title: tournamentData.title,
          game: tournamentData.type,
          start_date: tournamentData.start_date,
          end_date: tournamentData.end_date,
          main_prize: tournamentData.main_prize,
          twitch_url: tournamentData.twitch_url,
          header_url: tournamentData.header_url,
          description: tournamentData.description || ''
        });
      } else {
        setError('Tournoi non trouvé pour ce canal Twitch');
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      setError('Erreur lors du chargement du tournoi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = () => {
    checkTwitchStreamStatus();
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!embedContainerRef.current) return;

    try {
      if (!isFullscreen) {
        if (embedContainerRef.current.requestFullscreen) {
          embedContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const formatLastCheck = () => {
    const seconds = Math.floor((new Date().getTime() - lastStatusCheck.getTime()) / 1000);
    if (seconds < 60) return `il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `il y a ${minutes}min`;
  };

  const getTwitchEmbedUrl = () => {
    if (!channelName) return '';

    const params = new URLSearchParams({
      channel: channelName,
      parent: window.location.hostname,
      muted: isMuted.toString(),
      autoplay: 'true'
    });

    return `https://player.twitch.tv/?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du stream...</p>
        </div>
      </div>
    );
  }

  if (error || !channelName) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Link>

            <div className="bg-white dark:bg-dark-100 rounded-xl p-8 border border-gray-200 dark:border-gray-800">
              <h1 className="font-heading font-bold text-2xl mb-4 text-gray-900 dark:text-white">
                Stream non disponible
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'Le canal Twitch demandé n\'a pas pu être trouvé.'}
              </p>
              <Link to="/" className="btn btn-primary">
                Retourner à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50 dark:bg-dark-200">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux tournois
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Stream Area */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
                {/* Stream Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        streamStatus === 'online' ? 'bg-red-600' : streamStatus === 'loading' ? 'bg-gray-600' : 'bg-gray-500'
                      }`}>
                        <span className={`w-2 h-2 bg-white rounded-full ${streamStatus === 'online' ? 'animate-pulse' : ''}`}></span>
                      </div>
                      <div className="flex-1">
                        <h1 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                          {tournament?.title || `Stream de ${channelName}`}
                        </h1>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-3">
                          {streamStatus === 'loading' ? (
                            <span className="text-gray-500 flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-gray-500 mr-2"></div>
                              Vérification du statut...
                            </span>
                          ) : streamStatus === 'online' ? (
                            <span className="text-red-500 font-medium">🔴 EN DIRECT</span>
                          ) : (
                            <span className="text-gray-500">Hors ligne</span>
                          )}
                          <span className="text-xs text-gray-500">
                            Vérifié {formatLastCheck()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleRefreshStatus}
                        className="p-2 bg-gray-200 dark:bg-dark-300 hover:bg-gray-300 dark:hover:bg-dark-400 rounded-lg transition-colors"
                        title="Actualiser le statut"
                      >
                        <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </button>

                      <button
                        onClick={toggleMute}
                        className="p-2 bg-gray-200 dark:bg-dark-300 hover:bg-gray-300 dark:hover:bg-dark-400 rounded-lg transition-colors"
                        title={isMuted ? "Activer le son" : "Couper le son"}
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Volume2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>

                      <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-gray-200 dark:bg-dark-300 hover:bg-gray-300 dark:hover:bg-dark-400 rounded-lg transition-colors"
                        title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Maximize2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>

                      <a
                        href={`https://twitch.tv/${channelName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        title="Ouvrir sur Twitch"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Twitch Embed */}
                <div
                  ref={embedContainerRef}
                  className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'aspect-video'}`}
                >
                  <iframe
                    ref={iframeRef}
                    src={getTwitchEmbedUrl()}
                    className="w-full h-full"
                    allowFullScreen
                    title={`Stream Twitch de ${channelName}`}
                  />
                </div>

                {/* Stream Description */}
                {tournament?.description && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">À propos du tournoi</h3>
                    <p className="text-gray-700 dark:text-gray-300">{tournament.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Tournament Info */}
                {tournament && (
                  <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                    <h2 className="font-heading font-semibold text-xl mb-4 text-gray-900 dark:text-white">
                      Informations du tournoi
                    </h2>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Trophy className="h-5 w-5 text-warning-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Jeu</p>
                          <p className="font-medium text-gray-900 dark:text-white">{tournament.game}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-primary-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Date de début</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(tournament.start_date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-secondary-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Date de fin</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(tournament.end_date)}</p>
                        </div>
                      </div>

                      {tournament.main_prize && (
                        <div className="flex items-center">
                          <Trophy className="h-5 w-5 text-warning-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Prix principal</p>
                            <p className="font-medium text-warning-400">{tournament.main_prize}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      Voir le tournoi
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Link>
                  </div>
                )}

                {/* Stream Stats */}
                <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <h2 className="font-heading font-semibold text-xl mb-4 text-gray-900 dark:text-white">
                    Statut du stream
                  </h2>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg text-center ${
                      streamStatus === 'online' ? 'bg-red-100 dark:bg-red-500/20 border-2 border-red-300 dark:border-red-500/50' :
                      streamStatus === 'loading' ? 'bg-gray-100 dark:bg-dark-200' :
                      'bg-gray-100 dark:bg-dark-200'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        streamStatus === 'online' ? 'text-red-600 dark:text-red-400' :
                        streamStatus === 'loading' ? 'text-gray-500 dark:text-gray-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {streamStatus === 'loading' ? 'VÉRIFICATION...' :
                         streamStatus === 'online' ? '🔴 EN DIRECT' : 'HORS LIGNE'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {streamStatus === 'loading' ? 'Connexion au stream...' :
                         streamStatus === 'online' ? 'Le stream est en direct' :
                         'Le stream est actuellement hors ligne'}
                      </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-dark-200 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary-500">
                        {channelName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Canal Twitch</div>
                    </div>

                    <div className="bg-gray-100 dark:bg-dark-200 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Dernière vérification</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{formatLastCheck()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRefreshStatus}
                    className="mt-4 w-full bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser le statut
                  </button>

                  <a
                    href={`https://twitch.tv/${channelName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    Ouvrir sur Twitch
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <h2 className="font-heading font-semibold text-xl mb-4 text-gray-900 dark:text-white">
                    Actions rapides
                  </h2>

                  <div className="space-y-3">
                    <Link
                      to="/"
                      className="w-full bg-secondary-600 hover:bg-secondary-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      Voir d'autres tournois
                    </Link>

                    {tournament && (
                      <Link
                        to={`/tournaments/${tournament.id}`}
                        className="w-full bg-accent-600 hover:bg-accent-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        Page du tournoi
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitchEmbedPage;
