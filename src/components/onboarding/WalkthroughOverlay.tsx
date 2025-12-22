import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep } from '../../constants/onboardingSteps';
import {
  getViewportRect,
  getVisiblePortionRect,
  calculateTooltipPosition,
  TooltipPosition,
  ViewportRelativeRect,
} from '../../utils/walkthroughUtils';
import WalkthroughTooltip from './WalkthroughTooltip';

interface WalkthroughOverlayProps {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

const SPOTLIGHT_PADDING = 12;
const GOLD_COLOR = '#C8AA6E';

const WalkthroughOverlay: React.FC<WalkthroughOverlayProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}) => {
  const [viewportRect, setViewportRect] = useState<DOMRect | null>(null);
  const [visibleRect, setVisibleRect] = useState<ViewportRelativeRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const updatePositions = useCallback(() => {
    if (!step.targetElementId) return;

    let vpRect = getViewportRect(step.targetElementId);
    let visRect = getVisiblePortionRect(step.targetElementId);
    let usingFallback = false;

    if (!vpRect && step.fallbackTabId) {
      vpRect = getViewportRect(step.fallbackTabId);
      visRect = getVisiblePortionRect(step.fallbackTabId);
      usingFallback = true;
    }

    setViewportRect(vpRect);
    setVisibleRect(visRect);
    setIsUsingFallback(usingFallback);

    if (visRect) {
      const position = calculateTooltipPosition(visRect, usingFallback ? 'bottom' : step.position);
      setTooltipPosition(position);
    } else if (vpRect) {
      const fallbackRect: ViewportRelativeRect = {
        top: vpRect.top,
        left: vpRect.left,
        width: vpRect.width,
        height: vpRect.height,
        bottom: vpRect.bottom,
        right: vpRect.right,
      };
      const position = calculateTooltipPosition(fallbackRect, usingFallback ? 'bottom' : step.position);
      setTooltipPosition(position);
    }
  }, [step.targetElementId, step.position, step.fallbackTabId]);

  useEffect(() => {
    updatePositions();

    const handleResize = () => updatePositions();
    const handleScroll = () => updatePositions();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const interval = setInterval(updatePositions, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [updatePositions]);

  const getSpotlightClipPath = (): string => {
    if (!viewportRect) {
      return 'none';
    }

    const padding = SPOTLIGHT_PADDING;
    const x = viewportRect.left - padding;
    const y = viewportRect.top - padding;
    const width = viewportRect.width + padding * 2;
    const height = viewportRect.height + padding * 2;
    const radius = 12;

    return `
      polygon(
        0% 0%,
        0% 100%,
        ${x}px 100%,
        ${x}px ${y + radius}px,
        ${x + radius}px ${y}px,
        ${x + width - radius}px ${y}px,
        ${x + width}px ${y + radius}px,
        ${x + width}px ${y + height - radius}px,
        ${x + width - radius}px ${y + height}px,
        ${x + radius}px ${y + height}px,
        ${x}px ${y + height - radius}px,
        ${x}px 100%,
        100% 100%,
        100% 0%
      )
    `;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9998]"
      >
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            clipPath: viewportRect ? getSpotlightClipPath() : 'none',
          }}
          onClick={onSkip}
        />

        {viewportRect && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="fixed pointer-events-none"
              style={{
                top: viewportRect.top - SPOTLIGHT_PADDING,
                left: viewportRect.left - SPOTLIGHT_PADDING,
                width: viewportRect.width + SPOTLIGHT_PADDING * 2,
                height: viewportRect.height + SPOTLIGHT_PADDING * 2,
                borderRadius: 12,
                border: `2px solid ${GOLD_COLOR}`,
                boxShadow: `0 0 0 4px ${GOLD_COLOR}30, 0 0 30px ${GOLD_COLOR}40, inset 0 0 20px ${GOLD_COLOR}10`,
              }}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ delay: 0.2, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="fixed pointer-events-none"
              style={{
                top: viewportRect.top - SPOTLIGHT_PADDING - 4,
                left: viewportRect.left - SPOTLIGHT_PADDING - 4,
                width: viewportRect.width + SPOTLIGHT_PADDING * 2 + 8,
                height: viewportRect.height + SPOTLIGHT_PADDING * 2 + 8,
                borderRadius: 14,
                border: `2px solid ${GOLD_COLOR}50`,
              }}
            />
          </>
        )}

        {tooltipPosition && (
          <WalkthroughTooltip
            step={step}
            position={tooltipPosition}
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={onNext}
            onPrevious={onPrevious}
            onSkip={onSkip}
            isUsingFallback={isUsingFallback}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default WalkthroughOverlay;
