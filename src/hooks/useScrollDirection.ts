import { useState, useEffect, useCallback } from 'react';

type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  threshold?: number;
  initialVisible?: boolean;
}

interface UseScrollDirectionReturn {
  scrollDirection: ScrollDirection;
  isVisible: boolean;
  scrollY: number;
}

export const useScrollDirection = ({
  threshold = 10,
  initialVisible = true,
}: UseScrollDirectionOptions = {}): UseScrollDirectionReturn => {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (Math.abs(currentScrollY - lastScrollY) < threshold) {
      return;
    }

    const direction = currentScrollY > lastScrollY ? 'down' : 'up';

    if (direction !== scrollDirection) {
      setScrollDirection(direction);
      setIsVisible(direction === 'up' || currentScrollY < threshold);
    }

    if (currentScrollY < threshold) {
      setIsVisible(true);
    }

    setScrollY(currentScrollY);
    setLastScrollY(currentScrollY);
  }, [lastScrollY, scrollDirection, threshold]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollDirection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollDirection]);

  return { scrollDirection, isVisible, scrollY };
};

export default useScrollDirection;
