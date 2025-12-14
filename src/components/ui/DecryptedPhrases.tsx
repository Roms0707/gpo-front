import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DecryptedPhrasesProps {
  phrases: string[];
  speed?: number;
  revealDuration?: number;
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
  revealDuration,
  maxIterations = 10,
  pauseDuration = 2500,
  className = '',
  encryptedColor = '#10b981',
  isActive = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>[]{}',
}) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iterationCountRef = useRef(0);
  const wasActiveRef = useRef(isActive);
  const pauseStartTimeRef = useRef<number | null>(null);
  const remainingPauseRef = useRef<number | null>(null);

  const currentPhrase = phrases[currentPhraseIndex] || '';

  const getRandomChar = useCallback(() => {
    return characters[Math.floor(Math.random() * characters.length)];
  }, [characters]);

  const shuffleText = useCallback(
    (text: string, revealed: Set<number>) => {
      return text
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (revealed.has(i)) return text[i];
          return getRandomChar();
        })
        .join('');
    },
    [getRandomChar]
  );

  const getNextIndex = useCallback(
    (revealed: Set<number>, text: string): number => {
      for (let i = 0; i < text.length; i++) {
        if (text[i] !== ' ' && !revealed.has(i)) {
          return i;
        }
      }
      return -1;
    },
    []
  );

  const getNonSpaceCount = useCallback((text: string) => {
    return text.split('').filter((c) => c !== ' ').length;
  }, []);

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

  const scheduleNextPhrase = useCallback((delay: number) => {
    pauseStartTimeRef.current = Date.now();
    remainingPauseRef.current = delay;

    pauseTimeoutRef.current = setTimeout(() => {
      pauseStartTimeRef.current = null;
      remainingPauseRef.current = null;
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      setAnimationKey((k) => k + 1);
    }, delay);
  }, [phrases.length]);

  const startAnimation = useCallback(() => {
    clearTimers();
    setRevealedIndices(new Set());
    setDisplayText(shuffleText(currentPhrase, new Set()));
    setIsComplete(false);
    iterationCountRef.current = 0;
    pauseStartTimeRef.current = null;
    remainingPauseRef.current = null;

    const nonSpaceCount = getNonSpaceCount(currentPhrase);
    const effectiveSpeed = revealDuration && nonSpaceCount > 0
      ? revealDuration / (nonSpaceCount * maxIterations)
      : speed;

    intervalRef.current = setInterval(() => {
      iterationCountRef.current++;

      setRevealedIndices((prevRevealed) => {
        const charCount = getNonSpaceCount(currentPhrase);

        if (prevRevealed.size >= charCount) {
          return prevRevealed;
        }

        if (iterationCountRef.current >= maxIterations) {
          iterationCountRef.current = 0;
          const nextIndex = getNextIndex(prevRevealed, currentPhrase);
          if (nextIndex !== -1) {
            const newRevealed = new Set(prevRevealed);
            newRevealed.add(nextIndex);
            setDisplayText(shuffleText(currentPhrase, newRevealed));
            return newRevealed;
          }
        } else {
          setDisplayText(shuffleText(currentPhrase, prevRevealed));
        }

        return prevRevealed;
      });
    }, effectiveSpeed);
  }, [
    currentPhrase,
    speed,
    revealDuration,
    maxIterations,
    clearTimers,
    shuffleText,
    getNextIndex,
    getNonSpaceCount,
  ]);

  useEffect(() => {
    if (!currentPhrase) return;

    const nonSpaceCount = getNonSpaceCount(currentPhrase);

    if (revealedIndices.size >= nonSpaceCount && nonSpaceCount > 0 && !isComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsComplete(true);
      setDisplayText(currentPhrase);
      scheduleNextPhrase(pauseDuration);
    }
  }, [revealedIndices.size, currentPhrase, isComplete, pauseDuration, getNonSpaceCount, scheduleNextPhrase]);

  useEffect(() => {
    if (isActive && currentPhrase) {
      startAnimation();
    }

    return () => clearTimers();
  }, [animationKey, isActive]);

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      if (remainingPauseRef.current !== null && pauseStartTimeRef.current !== null) {
        const elapsed = Date.now() - pauseStartTimeRef.current;
        const remaining = Math.max(0, remainingPauseRef.current - elapsed);

        if (remaining > 0) {
          scheduleNextPhrase(remaining);
        } else {
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          setAnimationKey((k) => k + 1);
        }
      } else if (!isComplete) {
        setAnimationKey((k) => k + 1);
      } else {
        scheduleNextPhrase(pauseDuration);
      }
    }
    wasActiveRef.current = isActive;
  }, [isActive, phrases.length, isComplete, pauseDuration, scheduleNextPhrase]);

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      if (pauseStartTimeRef.current !== null && remainingPauseRef.current !== null) {
        const elapsed = Date.now() - pauseStartTimeRef.current;
        remainingPauseRef.current = Math.max(0, remainingPauseRef.current - elapsed);
      }
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
        transition={{ duration: 0.15 }}
        className="inline-block"
        aria-label={currentPhrase}
      >
        <span className="sr-only">{currentPhrase}</span>
        <span aria-hidden="true">
          {displayText.split('').map((char, index) => {
            const isRevealed =
              isComplete || revealedIndices.has(index) || currentPhrase[index] === ' ';
            return (
              <span
                key={index}
                className={isRevealed ? className : ''}
                style={
                  !isRevealed
                    ? {
                        color: encryptedColor,
                        opacity: 0.9,
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
