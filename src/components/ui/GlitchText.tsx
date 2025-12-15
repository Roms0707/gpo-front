import { CSSProperties } from 'react';
import './GlitchText.css';

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  intense?: boolean;
  className?: string;
  shadowColor1?: string;
  shadowColor2?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  speed = 1,
  enableShadows = true,
  enableOnHover = false,
  intense = false,
  className = '',
  shadowColor1 = 'red',
  shadowColor2 = 'cyan',
}) => {
  const inlineStyles: CSSProperties & Record<string, string> = {
    '--after-duration': `${speed * 5}s`,
    '--before-duration': `${speed * 4}s`,
    '--after-shadow': enableShadows ? `-3px 0 ${shadowColor1}` : 'none',
    '--before-shadow': enableShadows ? `3px 0 ${shadowColor2}` : 'none',
  };

  const hoverClass = enableOnHover ? 'glitch-hover-only' : '';
  const intenseClass = intense ? 'glitch-intense' : '';

  return (
    <div
      className={`glitch-text ${hoverClass} ${intenseClass} ${className}`}
      style={inlineStyles}
      data-text={children}
    >
      {children}
    </div>
  );
};
