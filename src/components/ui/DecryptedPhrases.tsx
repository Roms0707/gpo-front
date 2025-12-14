import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DecryptedPhrasesProps {
  phrases: string[];
  speed?: number;
  maxIterations?: number;
  pauseDuration?: number;
  className?: string;
  encryptedColor?: string;
  isActive?: boolean;
  characters?: string;
}

export const DecryptedPhrases: React.FC<DecryptedPhrasesProps> = ({
  phrases,
  speed = 50,
  maxIterations = 10,
  pauseDuration = 2500,
  className = '',
  encryptedColor = '#10b981',
  isActive = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>[]{}',
}) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState<string[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iterationCountRef = useRef<number[]>([]);
  const wasActiveRef = useRef(isActive);

  const currentPhrase = phrases[currentPhraseIndex] || '';

  const getRandomChar = useCallback(() => {
    return characters[Math.floor(Math.random() * characters.length)];
  }, [characters]);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  const initializeText = useCallback((text: string) => {
    const chars = text.split('');
    iterationCountRef.current = new Array(chars.length).fill(0);
    setDisplayText(chars.map((char) => (char === ' ' ? ' ' : getRandomChar())));
    setRevealedIndices(new Set());
  }, [getRandomChar]);

  const startAnimation = useCallback(() => {
    clearTimers();
    initializeText(currentPhrase);
    setIsAnimating(true);

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) => {
        const newDisplay = [...prev];

        for (let i = 0; i < currentPhrase.length; i++) {
          if (currentPhrase[i] === ' ') continue;

          setRevealedIndices((revealed) => {
            if (revealed.has(i)) {
              newDisplay[i] = currentPhrase[i];
              return revealed;
            }

            iterationCountRef.current[i]++;

            const firstUnrevealedIndex = currentPhrase
              .split('')
              .findIndex((char, idx) => char !== ' ' && !revealed.has(idx));

            if (i === firstUnrevealedIndex && iterationCountRef.current[i] >= maxIterations) {
              const newRevealed = new Set(revealed);
              newRevealed.add(i);
              newDisplay[i] = currentPhrase[i];
              return newRevealed;
            }

            if (!revealed.has(i)) {
              newDisplay[i] = getRandomChar();
            }

            return revealed;
          });
        }

        return newDisplay;
      });

      setRevealedIndices((revealed) => {
        const nonSpaceCount = currentPhrase.split('').filter((c) => c !== ' ').length;
        if (revealed.size >= nonSpaceCount && isAnimating) {
          clearTimers();
          setIsAnimating(false);

          pauseTimeoutRef.current = setTimeout(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
            setAnimationKey((k) => k + 1);
          }, pauseDuration);
        }
        return revealed;
      });
    }, speed);
  }, [
    currentPhrase,
    phrases.length,
    speed,
    maxIterations,
    pauseDuration,
    clearTimers,
    initializeText,
    getRandomChar,
    isAnimating,
  ]);

  useEffect(() => {
    if (isActive && currentPhrase) {
      startAnimation();
    }

    return () => clearTimers();
  }, [animationKey, isActive]);

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setCurrentPhraseIndex(0);
      setAnimationKey((k) => k + 1);
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      clearTimers();
    }
  }, [isActive, clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={`${currentPhraseIndex}-${animationKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="inline-block"
        aria-label={currentPhrase}
      >
        <span className="sr-only">{currentPhrase}</span>
        <span aria-hidden="true">
          {displayText.map((char, index) => {
            const isRevealed = revealedIndices.has(index) || currentPhrase[index] === ' ';
            return (
              <span
                key={index}
                className={isRevealed ? className : ''}
                style={
                  !isRevealed
                    ? {
                        color: encryptedColor,
                        opacity: 0.8,
                        fontFamily: 'monospace',
                      }
                    : undefined
                }
              >
                {char}
              </span>
            );
          })}
        </span>
      </motion.span>
    </AnimatePresence>
  );
};
