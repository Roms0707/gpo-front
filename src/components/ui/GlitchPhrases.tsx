import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlitchText } from './GlitchText';

interface GlitchPhrasesProps {
  phrases: string[];
  pauseDuration?: number;
  transitionDuration?: number;
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

export const GlitchPhrases: React.FC<GlitchPhrasesProps> = ({
  phrases,
  pauseDuration = 4000,
  transitionDuration = 0.4,
  speed = 0.8,
  className = '',
  isActive = true,
  shadowColor1 = '#ef4444',
  shadowColor2 = '#06b6d4',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  const scheduleNext = useCallback((delay: number) => {
    clearTimer();
    pauseStartRef.current = Date.now();
    remainingPauseRef.current = delay;

    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % phrases.length);
        setIsTransitioning(false);
        pauseStartRef.current = Date.now();
        remainingPauseRef.current = pauseDuration;
        scheduleNext(pauseDuration);
      }, transitionDuration * 1000);
    }, delay);
  }, [clearTimer, phrases.length, pauseDuration, transitionDuration]);

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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isTransitioning ? 0 : 1,
          y: isTransitioning ? -10 : 0,
          filter: isTransitioning ? 'blur(4px)' : 'blur(0px)',
        }}
        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
        transition={{ duration: transitionDuration, ease: 'easeInOut' }}
        className={`flex flex-col items-center ${className}`}
      >
        {parsed.lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className="flex flex-wrap justify-center items-center gap-x-3 md:gap-x-4"
          >
            {line.map((segment, segmentIndex) => (
              <GlitchText
                key={`${lineIndex}-${segmentIndex}`}
                speed={speed}
                enableShadows={true}
                enableOnHover={false}
                shadowColor1={shadowColor1}
                shadowColor2={shadowColor2}
                className="inline-block"
              >
                {segment}
              </GlitchText>
            ))}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
