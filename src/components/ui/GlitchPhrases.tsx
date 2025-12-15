import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlitchText } from './GlitchText';

interface GlitchPhrasesProps {
  phrases: string[];
  pauseDuration?: number;
  speed?: number;
  className?: string;
  isActive?: boolean;
  shadowColor1?: string;
  shadowColor2?: string;
}

interface ParsedPhrase {
  lines: string[][];
  original: string;
}

const parsePhrase = (phrase: string): ParsedPhrase => {
  const actionPattern = /^([\w]+)\.\s*([\w]+)\.\s*([\w]+)\s+(.+)$/;
  const match = phrase.match(actionPattern);

  if (match) {
    return {
      lines: [
        [`${match[1]}.`, `${match[2]}.`, `${match[3]}.`],
        [match[4]],
      ],
      original: phrase,
    };
  }

  return {
    lines: [[phrase]],
    original: phrase,
  };
};

type TransitionPhase = 'idle' | 'glitch-out' | 'switching' | 'glitch-in';

export const GlitchPhrases: React.FC<GlitchPhrasesProps> = ({
  phrases,
  pauseDuration = 5000,
  speed = 1.2,
  className = '',
  isActive = true,
  shadowColor1 = '#ef4444',
  shadowColor2 = '#06b6d4',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pauseStartRef = useRef<number | null>(null);
  const remainingPauseRef = useRef<number>(pauseDuration);
  const wasActiveRef = useRef(isActive);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTransition = useCallback(() => {
    setPhase('glitch-out');

    setTimeout(() => {
      setPhase('switching');

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % phrases.length);
        setPhase('glitch-in');

        setTimeout(() => {
          setPhase('idle');
        }, 400);
      }, 150);
    }, 500);
  }, [phrases.length]);

  const scheduleNext = useCallback((delay: number) => {
    clearTimer();
    pauseStartRef.current = Date.now();
    remainingPauseRef.current = delay;

    timeoutRef.current = setTimeout(() => {
      startTransition();
      pauseStartRef.current = Date.now();
      remainingPauseRef.current = pauseDuration;
      scheduleNext(pauseDuration + 1050);
    }, delay);
  }, [clearTimer, pauseDuration, startTransition]);

  useEffect(() => {
    if (isActive && phrases.length > 1) {
      scheduleNext(pauseDuration);
    }
    return () => clearTimer();
  }, [isActive, phrases.length, pauseDuration, scheduleNext, clearTimer]);

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      if (pauseStartRef.current !== null) {
        const elapsed = Date.now() - pauseStartRef.current;
        const remaining = Math.max(0, remainingPauseRef.current - elapsed);
        scheduleNext(remaining > 0 ? remaining : pauseDuration);
      } else {
        scheduleNext(pauseDuration);
      }
    } else if (!isActive && wasActiveRef.current) {
      clearTimer();
      if (pauseStartRef.current !== null) {
        const elapsed = Date.now() - pauseStartRef.current;
        remainingPauseRef.current = Math.max(0, remainingPauseRef.current - elapsed);
      }
    }
    wasActiveRef.current = isActive;
  }, [isActive, clearTimer, scheduleNext, pauseDuration]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  if (!phrases.length) return null;

  const currentPhrase = phrases[currentIndex] || phrases[0];
  const parsed = parsePhrase(currentPhrase);
  const isIntense = phase === 'glitch-out' || phase === 'glitch-in';
  const isHidden = phase === 'switching';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
        animate={{
          opacity: isHidden ? 0 : 1,
          scale: isHidden ? 1.02 : 1,
          filter: isHidden ? 'blur(12px)' : 'blur(0px)',
          x: phase === 'glitch-out' ? [0, -3, 3, -2, 2, 0] : 0,
        }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
          x: { duration: 0.3, ease: 'easeInOut' },
        }}
        className={`flex flex-col items-center ${className}`}
      >
        {parsed.lines.map((line, lineIndex) => (
          <motion.div
            key={lineIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: lineIndex * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="flex flex-wrap justify-center items-center gap-x-3 md:gap-x-4"
          >
            {line.map((segment, segmentIndex) => (
              <motion.span
                key={`${lineIndex}-${segmentIndex}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: lineIndex * 0.1 + segmentIndex * 0.08,
                }}
              >
                <GlitchText
                  speed={speed}
                  enableShadows={true}
                  enableOnHover={false}
                  intense={isIntense}
                  shadowColor1={shadowColor1}
                  shadowColor2={shadowColor2}
                  className="inline-block"
                >
                  {segment}
                </GlitchText>
              </motion.span>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
