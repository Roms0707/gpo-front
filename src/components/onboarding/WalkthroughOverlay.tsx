import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep } from '../../constants/onboardingSteps';
import {
  getElementRect,
  getViewportRect,
  calculateTooltipPosition,
  ElementRect,
  TooltipPosition,
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

const WalkthroughOverlay: React.FC<WalkthroughOverlayProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}) => {
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [viewportRect, setViewportRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  const updatePositions = useCallback(() => {
    if (!step.targetElementId) return;

    const elemRect = getElementRect(step.targetElementId);
    const vpRect = getViewportRect(step.targetElementId);

    setTargetRect(elemRect);
    setViewportRect(vpRect);

    if (elemRect) {
      const position = calculateTooltipPosition(elemRect, step.position);
      setTooltipPosition(position);
    }
  }, [step.targetElementId, step.position]);

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
          className="absolute inset-0 bg-black/75 transition-all duration-300"
          style={{
            clipPath: viewportRect ? getSpotlightClipPath() : 'none',
          }}
          onClick={onSkip}
        />

        {viewportRect && (
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
              boxShadow: '0 0 0 4px rgba(var(--color-primary-500), 0.5), 0 0 20px rgba(var(--color-primary-500), 0.3)',
            }}
          />
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
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default WalkthroughOverlay;
