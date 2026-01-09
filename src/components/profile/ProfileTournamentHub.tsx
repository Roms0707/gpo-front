import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Radio,
  Calendar,
  History,
  Trophy,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { GameTheme, getGameTheme } from '../../utils/gameThemes';
import { TournamentRegistration } from '../../types';

interface ProfileTournamentHubProps {
  registrations: TournamentRegistration[];
  theme: GameTheme;
  isLoading?: boolean;
}

type TabType = 'active' | 'upcoming' | 'history';

const ProfileTournamentHub: React.FC<ProfileTournamentHubProps> = ({
  registrations,
  theme,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const categorizedTournaments = useMemo(() => {
    const now = new Date();
    const active: TournamentRegistration[] = [];
    const upcoming: TournamentRegistration[] = [];
    const history: TournamentRegistration[] = [];

    registrations.forEach((reg) => {
      const tournament = reg.tournament;
      if (!tournament) return;

      const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
      const endDate = tournament.endDate ? new Date(tournament.endDate) : null;

      if (tournament.status === 'ongoing' || (startDate && endDate && now >= startDate && now <= endDate)) {
        active.push(reg);
      } else if (tournament.status === 'completed' || (endDate && now > endDate)) {
        history.push(reg);
      } else if (startDate && now < startDate) {
        upcoming.push(reg);
      } else {
        upcoming.push(reg);
      }
    });

    upcoming.sort((a, b) => {
      const dateA = a.tournament?.startDate ? new Date(a.tournament.startDate).getTime() : 0;
      const dateB = b.tournament?.startDate ? new Date(b.tournament.startDate).getTime() : 0;
      return dateA - dateB;
    });

    history.sort((a, b) => {
      const dateA = a.tournament?.endDate ? new Date(a.tournament.endDate).getTime() : 0;
      const dateB = b.tournament?.endDate ? new Date(b.tournament.endDate).getTime() : 0;
      return dateB - dateA;
    });

    return { active, upcoming, history };
  }, [registrations]);

  const tabs: { key: TabType; label: string; icon: React.FC<{ className?: string }>; count: number }[] = [
    { key: 'active', label: t('profile.active', 'Active'), icon: Radio, count: categorizedTournaments.active.length },
    { key: 'upcoming', label: t('profile.upcoming', 'Upcoming'), icon: Calendar, count: categorizedTournaments.upcoming.length },
    { key: 'history', label: t('profile.history', 'History'), icon: History, count: categorizedTournaments.history.length }
  ];

  const currentTournaments = categorizedTournaments[activeTab];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-dark-300 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-dark-300 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-dark-100">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-200'
                }`}
                style={isActive ? {
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 2px 10px ${theme.colors.primary}40`
                } : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive && tab.key === 'active' ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-dark-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Link
          to="/"
          className="text-sm font-medium flex items-center gap-1 hover:underline"
          style={{ color: theme.colors.primary }}
        >
          {t('profile.viewAll', 'View All')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="p-4">
        {currentTournaments.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}15` }}
            >
              <Trophy className="w-6 h-6" style={{ color: theme.colors.primary }} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {activeTab === 'active' && t('profile.noActiveTournaments', 'No active tournaments')}
              {activeTab === 'upcoming' && t('profile.noUpcomingTournaments', 'No upcoming tournaments')}
              {activeTab === 'history' && t('profile.noTournamentHistory', 'No tournament history')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentTournaments.slice(0, 4).map((reg) => (
              <TournamentCard
                key={reg.id}
                registration={reg}
                theme={theme}
                type={activeTab}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface TournamentCardProps {
  registration: TournamentRegistration;
  theme: GameTheme;
  type: TabType;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ registration, theme, type }) => {
  const { t } = useTranslation();
  const tournament = registration.tournament;
  if (!tournament) return null;

  const gameName = (tournament as any).games?.name || tournament.game;
  const gameTheme = getGameTheme(gameName);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-md group bg-gray-50 dark:bg-dark-200"
    >
      <div
        className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-dark-300"
        style={{
          border: `2px solid ${gameTheme.colors.primary}40`
        }}
      >
        {tournament.header_url || tournament.image ? (
          <img
            src={tournament.header_url || tournament.image}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${gameTheme.colors.primary}20` }}
          >
            <Trophy className="w-6 h-6" style={{ color: gameTheme.colors.primary }} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {type === 'active' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
              <Radio className="w-3 h-3 animate-pulse" />
              {t('profile.live', 'Live')}
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${gameTheme.colors.primary}20`,
              color: gameTheme.colors.primary
            }}
          >
            {gameName}
          </span>
        </div>

        <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
          {tournament.title}
        </h4>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          {type === 'upcoming' && tournament.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(tournament.startDate)}
            </span>
          )}
          {type === 'history' && (
            <span className="flex items-center gap-1">
              {registration.status === 'approved' ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <XCircle className="w-3 h-3 text-gray-400" />
              )}
              {registration.status === 'approved' ? t('profile.completed', 'Completed') : registration.status}
            </span>
          )}
          {type === 'active' && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('profile.inProgress', 'In Progress')}
            </span>
          )}
        </div>
      </div>

      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
    </Link>
  );
};

export default ProfileTournamentHub;
