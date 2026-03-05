import React from 'react';

interface GrindProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  className?: string;
}

const GrindProgressRing: React.FC<GrindProgressRingProps> = ({
  progress,
  size = 40,
  strokeWidth = 3,
  color = '#10B981',
  bgColor,
  showLabel = true,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor || 'currentColor'}
          strokeWidth={strokeWidth}
          className={bgColor ? '' : 'text-gray-200 dark:text-gray-700'}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-[10px] font-bold"
          style={{ color }}
        >
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

export default GrindProgressRing;
