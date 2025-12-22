import React from 'react';

interface Match {
  id: string;
  round: number;
  position: number;
  winner_id: string | null;
}

interface BracketConnectorsProps {
  matchesByRound: Record<number, Match[]>;
  rounds: number[];
  matchWidth: number;
  matchHeight: number;
  roundGap: number;
  matchGap: number;
  headerHeight: number;
}

const BracketConnectors: React.FC<BracketConnectorsProps> = ({
  matchesByRound,
  rounds,
  matchWidth,
  matchHeight,
  roundGap,
  matchGap,
  headerHeight
}) => {
  if (rounds.length < 2) return null;

  const getMatchYPosition = (round: number, position: number): number => {
    const matchesInRound = matchesByRound[round]?.length || 0;
    const roundIndex = rounds.indexOf(round);

    const baseSpacing = matchHeight + matchGap;
    const multiplier = Math.pow(2, roundIndex);
    const offsetY = ((multiplier - 1) * baseSpacing) / 2;

    return headerHeight + offsetY + (position - 1) * baseSpacing * multiplier + matchHeight / 2;
  };

  const getRoundXPosition = (round: number): number => {
    const roundIndex = rounds.indexOf(round);
    return roundIndex * (matchWidth + roundGap);
  };

  const paths: JSX.Element[] = [];

  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];
    const currentMatches = matchesByRound[currentRound] || [];
    const nextMatches = matchesByRound[nextRound] || [];

    currentMatches.forEach((match, idx) => {
      const nextMatchIndex = Math.floor(idx / 2);
      const nextMatch = nextMatches[nextMatchIndex];

      if (!nextMatch) return;

      const x1 = getRoundXPosition(currentRound) + matchWidth;
      const y1 = getMatchYPosition(currentRound, match.position);
      const x2 = getRoundXPosition(nextRound);
      const y2 = getMatchYPosition(nextRound, nextMatch.position);

      const curveOffset = roundGap * 0.4;
      const isCompleted = !!match.winner_id;

      const pathD = `
        M ${x1} ${y1}
        C ${x1 + curveOffset} ${y1}, ${x2 - curveOffset} ${y2}, ${x2} ${y2}
      `;

      paths.push(
        <path
          key={`connector-${match.id}-${nextMatch.id}`}
          d={pathD}
          fill="none"
          stroke={isCompleted ? '#22c55e' : '#6b7280'}
          strokeWidth={isCompleted ? 2.5 : 2}
          strokeLinecap="round"
          className={isCompleted ? 'drop-shadow-sm' : ''}
          style={{
            opacity: isCompleted ? 1 : 0.5,
            transition: 'all 0.3s ease'
          }}
        />
      );

      if (isCompleted) {
        paths.push(
          <circle
            key={`dot-${match.id}`}
            cx={x1}
            cy={y1}
            r={4}
            fill="#22c55e"
            className="drop-shadow-sm"
          />
        );
      }
    });
  }

  const totalWidth = rounds.length * matchWidth + (rounds.length - 1) * roundGap;
  const maxMatches = Math.max(...Object.values(matchesByRound).map(m => m.length));
  const lastRoundMultiplier = Math.pow(2, rounds.length - 1);
  const totalHeight = headerHeight + maxMatches * (matchHeight + matchGap) * lastRoundMultiplier;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="connectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
        </linearGradient>
      </defs>
      {paths}
    </svg>
  );
};

export default BracketConnectors;
