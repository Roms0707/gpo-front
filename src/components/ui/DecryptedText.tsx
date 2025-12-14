import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  animateOn?: 'hover' | 'view';
  onAnimationComplete?: () => void;
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = true,
  revealDirection = 'start',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',
  className = '',
  encryptedClassName = '',
  animateOn = 'view',
  onAnimationComplete,
}) => {
  const [displayText, setDisplayText] = useState<string[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iterationCountRef = useRef<number[]>([]);

  const getRandomChar = useCallback(() => {
    return characters[Math.floor(Math.random() * characters.length)];
  }, [characters]);

  const initializeText = useCallback(() => {
    const chars = text.split('');
    iterationCountRef.current = new Array(chars.length).fill(0);
    setDisplayText(chars.map((char) => (char === ' ' ? ' ' : getRandomChar())));
    setRevealedIndices(new Set());
  }, [text, getRandomChar]);

  const getNextIndexToReveal = useCallback(
    (revealed: Set<number>): number | null => {
      const textLength = text.length;
      const nonSpaceIndices: number[] = [];

      for (let i = 0; i < textLength; i++) {
        if (text[i] !== ' ' && !revealed.has(i)) {
          nonSpaceIndices.push(i);
        }
      }

      if (nonSpaceIndices.length === 0) return null;

      if (revealDirection === 'start') {
        return nonSpaceIndices[0];
      } else if (revealDirection === 'end') {
        return nonSpaceIndices[nonSpaceIndices.length - 1];
      } else {
        const center = Math.floor(textLength / 2);
        nonSpaceIndices.sort(
          (a, b) => Math.abs(a - center) - Math.abs(b - center)
        );
        return nonSpaceIndices[0];
      }
    },
    [text, revealDirection]
  );

  const animate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsAnimating(true);
    initializeText();

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) => {
        const newDisplay = [...prev];
        let allRevealed = true;

        for (let i = 0; i < text.length; i++) {
          if (text[i] === ' ') continue;

          setRevealedIndices((revealed) => {
            if (revealed.has(i)) {
              newDisplay[i] = text[i];
              return revealed;
            }

            iterationCountRef.current[i]++;

            if (sequential) {
              const nextIndex = getNextIndexToReveal(revealed);
              if (nextIndex === i && iterationCountRef.current[i] >= maxIterations) {
                const newRevealed = new Set(revealed);
                newRevealed.add(i);
                newDisplay[i] = text[i];
                return newRevealed;
              }
            } else {
              if (iterationCountRef.current[i] >= maxIterations) {
                const newRevealed = new Set(revealed);
                newRevealed.add(i);
                newDisplay[i] = text[i];
                return newRevealed;
              }
            }

            if (!revealed.has(i)) {
              allRevealed = false;
              newDisplay[i] = getRandomChar();
            }

            return revealed;
          });
        }

        return newDisplay;
      });

      setRevealedIndices((revealed) => {
        const nonSpaceCount = text.split('').filter((c) => c !== ' ').length;
        if (revealed.size >= nonSpaceCount) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsAnimating(false);
          setHasAnimated(true);
          onAnimationComplete?.();
        }
        return revealed;
      });
    }, speed);
  }, [
    text,
    speed,
    maxIterations,
    sequential,
    initializeText,
    getRandomChar,
    getNextIndexToReveal,
    onAnimationComplete,
  ]);

  useEffect(() => {
    if (animateOn === 'view' && !hasAnimated) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animate();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }
  }, [animateOn, hasAnimated, animate]);

  useEffect(() => {
    if (animateOn === 'hover' && isHovering && !isAnimating) {
      animate();
    }
  }, [animateOn, isHovering, isAnimating, animate]);

  useEffect(() => {
    setDisplayText(text.split(''));
    const initialRevealed = new Set<number>();
    text.split('').forEach((char, i) => {
      if (char === ' ') initialRevealed.add(i);
    });
    setRevealedIndices(initialRevealed);
  }, [text]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const triggerAnimation = useCallback(() => {
    setHasAnimated(false);
    animate();
  }, [animate]);

  return (
    <motion.span
      ref={containerRef}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={text}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText.map((char, index) => {
          const isRevealed = revealedIndices.has(index) || text[index] === ' ';
          return (
            <span
              key={index}
              className={isRevealed ? className : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
};

export const useDecryptedTextTrigger = () => {
  const triggerRef = useRef<(() => void) | null>(null);

  const setTrigger = useCallback((fn: () => void) => {
    triggerRef.current = fn;
  }, []);

  const trigger = useCallback(() => {
    triggerRef.current?.();
  }, []);

  return { setTrigger, trigger };
};
