import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Users, Trophy, Calendar, MapPin, UserCheck, Globe } from 'lucide-react';
import { Tournament } from '../../../types';
import { formatDate, formatEligibleCountries } from '../../../utils/formatters';
import ExpandableText from '../../ui/ExpandableText';
import TiltedCard from '../../ui/TiltedCard';
import { getGameTheme, getCardClipPath, getCardBorderRadius } from '../../../utils/gameThemes';
import { calculateTournamentStatus } from '../../../utils/tournamentUtils';

interface HomeTabProps {
  tournament: Tournament;
  gameName: string;
}

const HomeTab: React.FC<HomeTabProps> = ({ tournament, gameName }) => {
  const { t } = useTranslation();

  const gameTheme = getGameTheme(gameName || tournament?.game);
  const clipPath = getCardClipPath(gameTheme.shape);
  const borderRadius = getCardBorderRadius(gameTheme.shape);

  const tournamentStatus = calculateTournamentStatus(tournament);
  const isCompleted = tournamentStatus === 'completed';

  const containerStyles: React.CSSProperties = {
    clipPath: clipPath !== 'none' ? clipPath : undefined,
    borderRadius: clipPath !== 'none' ? borderRadius : '16px',
  };

  const accentColor = isCompleted ? '#6B7280' : gameTheme.colors.primary;
  const glowColor = isCompleted ? 'rgba(107, 114, 128, 0.3)' : gameTheme.colors.glow;

  return (
    <div className={`space-y-6 ${isCompleted ? 'opacity-80' : ''}`}>
      {/* Description Section */}
      {tournament.description && (
        <TiltedCard
          maxTilt={4}
          scale={1.02}
          shineIntensity={0.15}
          disabled={isCompleted}
        >
          <div
            className="relative overflow-hidden border p-5 md:p-6 backdrop-blur-sm"
            style={{
              ...containerStyles,
              borderColor: `${accentColor}40`,
              background: `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}06 40%, rgba(255, 255, 255, 0.6) 100%)`,
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
                  style={{ backgroundColor: `${accentColor}25` }}
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
        </TiltedCard>
      )}

      {/* Tournament Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule Section */}
        <TiltedCard
          maxTilt={4}
          scale={1.02}
          shineIntensity={0.15}
          disabled={isCompleted}
        >
          <div
            className="border p-5 backdrop-blur-sm h-full"
            style={{
              ...containerStyles,
              borderColor: `${accentColor}40`,
              background: `linear-gradient(145deg, ${accentColor}10 0%, ${accentColor}05 35%, rgba(255, 255, 255, 0.65) 100%)`,
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
        </TiltedCard>

        {/* Format Section */}
        <TiltedCard
          maxTilt={4}
          scale={1.02}
          shineIntensity={0.15}
          disabled={isCompleted}
        >
          <div
            className="border p-5 backdrop-blur-sm h-full"
            style={{
              ...containerStyles,
              borderColor: `${accentColor}40`,
              background: `linear-gradient(215deg, ${accentColor}10 0%, ${accentColor}05 35%, rgba(255, 255, 255, 0.65) 100%)`,
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
        </TiltedCard>
      </div>

      {/* Requirements Section */}
      {(tournament?.locationType || tournament?.minimum_age || tournament?.eligible_countries) && (
        <TiltedCard
          maxTilt={4}
          scale={1.02}
          shineIntensity={0.15}
          disabled={isCompleted}
        >
          <div
            className="border p-5 backdrop-blur-sm"
            style={{
              ...containerStyles,
              borderColor: `${accentColor}40`,
              background: `linear-gradient(45deg, ${accentColor}10 0%, ${accentColor}04 40%, rgba(255, 255, 255, 0.65) 100%)`,
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
        </TiltedCard>
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
      className={`group relative flex items-center gap-4 py-3 transition-all duration-300 ${
        isCompleted ? 'opacity-60' : 'hover:translate-x-1'
      }`}
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${accentColor}25 0%, ${accentColor}10 100%)`,
          border: `1px solid ${accentColor}30`,
          boxShadow: isCompleted ? 'none' : `0 4px 16px ${accentColor}15`,
        }}
      >
        <Icon
          className="w-5 h-5 transition-all duration-300"
          style={{
            color: accentColor,
            filter: isCompleted ? 'none' : `drop-shadow(0 2px 6px ${accentColor}50)`,
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-xs uppercase tracking-wider mb-0.5 font-medium"
          style={{ color: `${accentColor}` }}
        >
          {label}
        </p>
        <p className="font-semibold text-gray-900 dark:text-white text-sm md:text-base break-words leading-snug">
          {value}
        </p>
      </div>
    </div>
  );
};

export default HomeTab;
