import { useState, useEffect, useCallback } from 'react';

interface TypewriterTextProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  cursorClassName?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  className = '',
  cursorClassName = '',
}) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentPhrase = phrases[currentPhraseIndex];

  const handleTyping = useCallback(() => {
    if (isPaused) return;

    if (!isDeleting) {
      if (currentText.length < currentPhrase.length) {
        setCurrentText(currentPhrase.slice(0, currentText.length + 1));
      } else {
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (currentText.length > 0) {
        setCurrentText(currentText.slice(0, -1));
      } else {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }
  }, [currentText, currentPhrase, isDeleting, isPaused, pauseDuration, phrases.length]);

  useEffect(() => {
    if (isPaused) return;

    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(handleTyping, speed);

    return () => clearTimeout(timer);
  }, [handleTyping, isDeleting, isPaused, typingSpeed, deletingSpeed]);

  return (
    <span className={className}>
      {currentText}
      <span className={`typewriter-cursor ${cursorClassName}`}>|</span>
    </span>
  );
};
