import { CSSProperties } from 'react';
import './GlitchText.css';

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  shadowColor1?: string;
  shadowColor2?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  speed = 1,
  enableShadows = true,
  enableOnHover = false,
  className = '',
  shadowColor1 = 'red',
  shadowColor2 = 'cyan',
}) => {
  const inlineStyles: CSSProperties & Record<string, string> = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? `-5px 0 ${shadowColor1}` : 'none',
    '--before-shadow': enableShadows ? `5px 0 ${shadowColor2}` : 'none',
  };

  const hoverClass = enableOnHover ? 'glitch-hover-only' : '';

  return (
    <div
      className={`glitch-text ${hoverClass} ${className}`}
      style={inlineStyles}
      data-text={children}
    >
      {children}
    </div>
  );
};
