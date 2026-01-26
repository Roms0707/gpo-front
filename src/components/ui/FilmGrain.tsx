import React from 'react';

interface FilmGrainProps {
  opacity?: number;
  blendMode?: 'overlay' | 'soft-light' | 'multiply' | 'screen';
  animated?: boolean;
  className?: string;
}

export const FilmGrain: React.FC<FilmGrainProps> = ({
  opacity = 0.15,
  blendMode = 'overlay',
  animated = true,
  className = '',
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity,
        mixBlendMode: blendMode,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="filmGrain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              seed="1"
              stitchTiles="stitch"
              result="noise"
            >
              {animated && (
                <animate
                  attributeName="seed"
                  values="1;10;1"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="monoNoise"
            />
            <feComponentTransfer in="monoNoise" result="grain">
              <feFuncR type="linear" slope="1.5" intercept="-0.25" />
              <feFuncG type="linear" slope="1.5" intercept="-0.25" />
              <feFuncB type="linear" slope="1.5" intercept="-0.25" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#filmGrain)"
          fill="transparent"
        />
      </svg>
    </div>
  );
};
