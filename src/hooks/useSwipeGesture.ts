import { useEffect, useRef, useState } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  preventDefaultTouchmoveEvent?: boolean;
  enabled?: boolean;
}

export const useSwipeGesture = (config: SwipeConfig) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance = 50,
    preventDefaultTouchmoveEvent = false,
    enabled = true
  } = config;

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled) return;

    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndY.current = e.targetTouches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled) return;

    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!enabled) {
      setIsSwiping(false);
      return;
    }

    setIsSwiping(false);
    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = Math.abs(touchStartY.current - touchEndY.current);
    const isSwipeLeft = distanceX > minSwipeDistance;
    const isSwipeRight = distanceX < -minSwipeDistance;

    if (distanceY > 30) {
      touchStartX.current = 0;
      touchEndX.current = 0;
      touchStartY.current = 0;
      touchEndY.current = 0;
      return;
    }

    if (isSwipeLeft && onSwipeLeft) {
      onSwipeLeft();
    } else if (isSwipeRight && onSwipeRight) {
      onSwipeRight();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isSwiping
  };
};

export default useSwipeGesture;
