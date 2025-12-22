import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Users, Trophy, Calendar, MapPin, UserCheck, Globe, Clock, Zap } from 'lucide-react';
import { Tournament } from '../../../types';
import { formatDate, formatEligibleCountries } from '../../../utils/formatters';
import ExpandableText from '../../ui/ExpandableText';
import { getGameTheme, getCardClipPath, getCardBorderRadius } from '../../../utils/gameThemes';

interface HomeTabProps {
  tournament: Tournament;
  gameName: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

const HomeTab: React.FC<HomeTabProps> = ({ tournament, gameName }) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [tournamentStatus, setTournamentStatus] = useState<TournamentStatus>('upcoming');

  const gameTheme = getGameTheme(gameName || tournament?.game);
  const clipPath = getCardClipPath(gameTheme.shape);
  const borderRadius = getCardBorderRadius(gameTheme.shape);

  useEffect(() => {
    const calculateStatus = () => {
      const now = new Date();
      const startDate = new Date(tournament.startDate);
      const endDate = new Date(tournament.endDate);

      if (now > endDate) {
        return 'completed';
      } else if (now >= startDate && now <= endDate) {
        return 'ongoing';
      }
      return 'upcoming';
    };

    const calculateCountdown = () => {
      const now = new Date();
      const startDate = new Date(tournament.startDate);
      const diff = startDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const updateTimer = () => {
      setTournamentStatus(calculateStatus());
      setCountdown(calculateCountdown());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [tournament.startDate, tournament.endDate]);

  const isCompleted = tournamentStatus === 'completed';
  const isOngoing = tournamentStatus === 'ongoing';

  const containerStyles: React.CSSProperties = {
    clipPath: clipPath !== 'none' ? clipPath : undefined,
    borderRadius: clipPath !== 'none' ? borderRadius : '16px',
  };

  const accentColor = isCompleted ? '#6B7280' : gameTheme.colors.primary;
  const glowColor = isCompleted ? 'rgba(107, 114, 128, 0.3)' : gameTheme.colors.glow;

  return (
    <div className={`space-y-6 ${isCompleted ? 'opacity-80' : ''}`}>
      {/* Countdown Timer Section */}
      <div
        className="relative overflow-hidden border-2 p-6"
        style={{
          ...containerStyles,
          borderColor: accentColor,
          background: isCompleted
            ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.05) 100%)'
            : `linear-gradient(135deg, ${gameTheme.colors.primary}15 0%, ${gameTheme.colors.secondary}10 100%)`,
          boxShadow: isCompleted ? 'none' : `0 0 40px ${glowColor}`,
        }}
      >
        {/* Background Decoration */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${accentColor} 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${gameTheme.colors.secondary} 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10">
          {/* Status Badge */}
          <div className="flex items-center justify-center mb-4">
            {isCompleted ? (
              <div className="flex items-center space-x-2 bg-gray-600/20 px-4 py-2 rounded-full border border-gray-500/30">
                <Trophy className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400 font-semibold uppercase tracking-wider text-sm">
                  {t('homeTab.tournamentCompleted')}
                </span>
              </div>
            ) : isOngoing ? (
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full border animate-pulse"
                style={{
                  backgroundColor: `${accentColor}20`,
                  borderColor: `${accentColor}50`,
                }}
              >
                <Zap className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-semibold uppercase tracking-wider text-sm" style={{ color: accentColor }}>
                  {t('homeTab.tournamentInProgress')}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: `${accentColor}20`,
                  borderColor: `${accentColor}50`,
                }}
              >
                <Clock className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-semibold uppercase tracking-wider text-sm" style={{ color: accentColor }}>
                  {t('homeTab.startsIn')}
                </span>
              </div>
            )}
          </div>

          {/* Countdown Timer */}
          {!isCompleted && !isOngoing && (
            <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-lg mx-auto">
              {[
                { value: countdown.days, label: t('homeTab.days') },
                { value: countdown.hours, label: t('homeTab.hours') },
                { value: countdown.minutes, label: t('homeTab.minutes') },
                { value: countdown.seconds, label: t('homeTab.seconds') },
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <div
                    className="bg-white/10 dark:bg-dark-200/50 backdrop-blur-sm border-2 p-3 md:p-4 text-center transition-all duration-300 group-hover:scale-105"
                    style={{
                      borderColor: `${accentColor}40`,
                      borderRadius: '12px',
                      boxShadow: `0 4px 20px ${glowColor}`,
                    }}
                  >
                    <div
                      className="text-3xl md:text-4xl font-bold font-mono"
                      style={{ color: accentColor }}
                    >
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                      {item.label}
                    </div>
                  </div>
                  {/* Glow effect on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"
                    style={{
                      boxShadow: `0 0 30px ${glowColor}`,
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Completed/Ongoing Message */}
          {(isCompleted || isOngoing) && (
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isCompleted ? t('homeTab.tournamentEndedOn') : t('homeTab.tournamentStartedOn')}
              </p>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-1">
                {formatDate(isCompleted ? tournament.endDate : tournament.startDate)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div
        className="flex flex-wrap items-center justify-center gap-4 p-4 border"
        style={{
          ...containerStyles,
          borderColor: `${accentColor}30`,
          background: isCompleted
            ? 'rgba(107, 114, 128, 0.05)'
            : `linear-gradient(90deg, ${gameTheme.colors.primary}08 0%, ${gameTheme.colors.secondary}05 50%, ${gameTheme.colors.primary}08 100%)`,
        }}
      >
        {/* Game Badge */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-700">
          <Gamepad2 className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {gameName || tournament?.game}
          </span>
        </div>

        {/* Mode Badge */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-700">
          <Users className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {tournament?.mode}
          </span>
        </div>

        {/* Format Badge */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/50 dark:bg-dark-200/50 border border-gray-200 dark:border-gray-700">
          <Trophy className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {tournament?.format}
          </span>
        </div>
      </div>

      {/* Description Section */}
      {tournament.description && (
        <div
          className="relative overflow-hidden border p-5 md:p-6"
          style={{
            ...containerStyles,
            borderColor: `${accentColor}30`,
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: accentColor }}
          />
          <div className="pl-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Gamepad2 className="w-4 h-4" style={{ color: accentColor }} />
              </span>
              {t('homeTab.about')}
            </h3>
            <ExpandableText
              text={tournament.description}
              maxLines={4}
              maxLinesMobile={2}
              maxLinesTablet={3}
              className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed"
              showGradient={false}
            />
          </div>
        </div>
      )}

      {/* Tournament Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule Section */}
        <div
          className="border p-5"
          style={{
            ...containerStyles,
            borderColor: `${accentColor}30`,
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <h4
            className="text-sm font-semibold uppercase tracking-wider mb-4 pb-2 border-b"
            style={{ color: accentColor, borderColor: `${accentColor}30` }}
          >
            {t('homeTab.schedule')}
          </h4>
          <div className="space-y-4">
            <InfoCard
              icon={Calendar}
              label={t('homeTab.tournamentStartDate')}
              value={formatDate(tournament.startDate)}
              accentColor={accentColor}
              glowColor={glowColor}
              isCompleted={isCompleted}
            />
            <InfoCard
              icon={Calendar}
              label={t('homeTab.tournamentEndDate')}
              value={formatDate(tournament.endDate)}
              accentColor={accentColor}
              glowColor={glowColor}
              isCompleted={isCompleted}
            />
          </div>
        </div>

        {/* Format Section */}
        <div
          className="border p-5"
          style={{
            ...containerStyles,
            borderColor: `${accentColor}30`,
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <h4
            className="text-sm font-semibold uppercase tracking-wider mb-4 pb-2 border-b"
            style={{ color: accentColor, borderColor: `${accentColor}30` }}
          >
            {t('homeTab.formatSection')}
          </h4>
          <div className="space-y-4">
            <InfoCard
              icon={Gamepad2}
              label={t('homeTab.game')}
              value={gameName || tournament?.game}
              accentColor={accentColor}
              glowColor={glowColor}
              isCompleted={isCompleted}
            />
            <InfoCard
              icon={Users}
              label={t('homeTab.mode')}
              value={tournament?.mode}
              accentColor={accentColor}
              glowColor={glowColor}
              isCompleted={isCompleted}
            />
            <InfoCard
              icon={Trophy}
              label={t('homeTab.format')}
              value={tournament?.format}
              accentColor={accentColor}
              glowColor={glowColor}
              isCompleted={isCompleted}
            />
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      {(tournament?.locationType || tournament?.minimum_age || tournament?.eligible_countries) && (
        <div
          className="border p-5"
          style={{
            ...containerStyles,
            borderColor: `${accentColor}30`,
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <h4
            className="text-sm font-semibold uppercase tracking-wider mb-4 pb-2 border-b"
            style={{ color: accentColor, borderColor: `${accentColor}30` }}
          >
            {t('homeTab.requirements')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournament?.locationType && (
              <InfoCard
                icon={MapPin}
                label={t('homeTab.location')}
                value={`${tournament.locationType}${tournament.locationName ? ` - ${tournament.locationName}` : ''}`}
                accentColor={accentColor}
                glowColor={glowColor}
                isCompleted={isCompleted}
              />
            )}
            {tournament?.minimum_age && (
              <InfoCard
                icon={UserCheck}
                label={t('homeTab.minimumAge')}
                value={`${tournament.minimum_age} ${t('homeTab.years')}`}
                accentColor={accentColor}
                glowColor={glowColor}
                isCompleted={isCompleted}
              />
            )}
            {tournament?.eligible_countries && (
              <InfoCard
                icon={Globe}
                label={t('homeTab.eligibleCountries')}
                value={formatEligibleCountries(tournament.eligible_countries)}
                accentColor={accentColor}
                glowColor={glowColor}
                isCompleted={isCompleted}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  accentColor: string;
  glowColor: string;
  isCompleted: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, label, value, accentColor, glowColor, isCompleted }) => {
  return (
    <div
      className={`group flex items-start space-x-3 p-3 rounded-xl transition-all duration-300 ${
        isCompleted ? '' : 'hover:bg-white/50 dark:hover:bg-dark-200/30'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.3)',
      }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
        style={{
          backgroundColor: `${accentColor}15`,
          boxShadow: isCompleted ? 'none' : `0 0 0 0 ${glowColor}`,
        }}
      >
        <Icon
          className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
          style={{ color: accentColor }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base break-words">
          {value}
        </p>
      </div>
    </div>
  );
};

export default HomeTab;
