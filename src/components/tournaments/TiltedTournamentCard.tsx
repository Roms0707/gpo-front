import React from 'react';
import TiltedCard from '../ui/TiltedCard';
import TournamentCard from './TournamentCard';
import { Tournament } from '../../types';

interface TiltedTournamentCardProps {
  tournament: Tournament & {
    calculatedStatus?: 'ongoing' | 'upcoming' | 'completed';
    registrationStatus?: 'open' | 'closed' | 'not_started';
    is_twitch_live?: boolean;
    twitch_last_checked?: string;
    prizes?: any[];
  };
}

const getTiltConfig = (status: string | undefined, isLive: boolean) => {
  switch (status) {
    case 'ongoing':
      return {
        maxTilt: isLive ? 6 : 5,
        scale: 1.025,
        shineIntensity: isLive ? 0.18 : 0.15,
        glowIntensity: isLive ? 1.5 : 1,
        glowColor: isLive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(var(--color-primary-rgb, 59, 130, 246), 0.4)'
      };
    case 'upcoming':
      return {
        maxTilt: 4,
        scale: 1.02,
        shineIntensity: 0.12,
        glowIntensity: 0.5,
        glowColor: 'rgba(var(--color-primary-rgb, 59, 130, 246), 0.3)'
      };
    case 'completed':
      return {
        maxTilt: 2,
        scale: 1.01,
        shineIntensity: 0.08,
        glowIntensity: 0,
        glowColor: 'transparent'
      };
    default:
      return {
        maxTilt: 3,
        scale: 1.015,
        shineIntensity: 0.1,
        glowIntensity: 0.3,
        glowColor: 'rgba(var(--color-primary-rgb, 59, 130, 246), 0.25)'
      };
  }
};

const TiltedTournamentCard: React.FC<TiltedTournamentCardProps> = ({ tournament }) => {
  const status = tournament.calculatedStatus;
  const isLive = status === 'ongoing' && tournament.is_twitch_live;
  const config = getTiltConfig(status, isLive);

  const isOngoing = status === 'ongoing';

  return (
    <div className={`tilted-tournament-card ${isOngoing ? 'tilted-tournament-card--ongoing' : ''} ${isLive ? 'tilted-tournament-card--live' : ''}`}>
      <TiltedCard
        maxTilt={config.maxTilt}
        scale={config.scale}
        shineIntensity={config.shineIntensity}
        glowIntensity={config.glowIntensity}
        glowColor={config.glowColor}
        transitionDuration={250}
        className="tournament-tilt-wrapper"
      >
        <TournamentCard tournament={tournament} />
      </TiltedCard>
    </div>
  );
};

export default TiltedTournamentCard;
