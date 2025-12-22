import React, { useMemo } from 'react';
import TiltedCard from '../ui/TiltedCard';
import TournamentCard from './TournamentCard';
import { Tournament } from '../../types';
import { getGameTheme } from '../../utils/gameThemes';

interface TiltedTournamentCardProps {
  tournament: Tournament & {
    calculatedStatus?: 'ongoing' | 'upcoming' | 'completed';
    registrationStatus?: 'open' | 'closed' | 'not_started';
    is_twitch_live?: boolean;
    twitch_last_checked?: string;
    prizes?: any[];
  };
}

const getTiltConfig = (status: string | undefined, isLive: boolean, gameGlow: string) => {
  switch (status) {
    case 'ongoing':
      return {
        maxTilt: isLive ? 8 : 6,
        scale: 1.02,
        shineIntensity: isLive ? 0.2 : 0.15,
        glowIntensity: isLive ? 1.8 : 1.2,
        glowColor: isLive ? 'rgba(239, 68, 68, 0.6)' : gameGlow
      };
    case 'upcoming':
      return {
        maxTilt: 5,
        scale: 1.015,
        shineIntensity: 0.12,
        glowIntensity: 0.8,
        glowColor: gameGlow
      };
    case 'completed':
      return {
        maxTilt: 3,
        scale: 1.01,
        shineIntensity: 0.06,
        glowIntensity: 0.2,
        glowColor: 'rgba(100, 100, 100, 0.3)'
      };
    default:
      return {
        maxTilt: 4,
        scale: 1.015,
        shineIntensity: 0.1,
        glowIntensity: 0.5,
        glowColor: gameGlow
      };
  }
};

const TiltedTournamentCard: React.FC<TiltedTournamentCardProps> = ({ tournament }) => {
  const status = tournament.calculatedStatus;
  const isLive = status === 'ongoing' && tournament.is_twitch_live;

  const gameTheme = useMemo(() => getGameTheme(tournament.game), [tournament.game]);
  const config = useMemo(
    () => getTiltConfig(status, isLive, gameTheme.colors.glow),
    [status, isLive, gameTheme.colors.glow]
  );

  const isOngoing = status === 'ongoing';

  return (
    <div className={`tilted-tournament-card ${isOngoing ? 'tilted-tournament-card--ongoing' : ''} ${isLive ? 'tilted-tournament-card--live' : ''}`}>
      <TiltedCard
        maxTilt={config.maxTilt}
        scale={config.scale}
        shineIntensity={config.shineIntensity}
        glowIntensity={config.glowIntensity}
        glowColor={config.glowColor}
        transitionDuration={300}
        className="tournament-tilt-wrapper"
      >
        <TournamentCard tournament={tournament} />
      </TiltedCard>
    </div>
  );
};

export default TiltedTournamentCard;
