import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useOnboardingWalkthrough } from '../../hooks/useOnboardingWalkthrough';
import WelcomeStep from './WelcomeStep';
import WalkthroughOverlay from './WalkthroughOverlay';

const EXCLUDED_PATHS = ['/login', '/signup', '/register'];

const OnboardingWalkthrough: React.FC = () => {
  const location = useLocation();
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    isWelcomeStep,
    nextStep,
    previousStep,
    skipWalkthrough,
  } = useOnboardingWalkthrough();

  const isExcludedPath = EXCLUDED_PATHS.some(path =>
    location.pathname.startsWith(path)
  );

  if (!isActive || isExcludedPath || !currentStepData) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isWelcomeStep ? (
        <WelcomeStep
          key="welcome"
          onStart={nextStep}
          onSkip={skipWalkthrough}
        />
      ) : (
        <WalkthroughOverlay
          key={`step-${currentStep}`}
          step={currentStepData}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipWalkthrough}
        />
      )}
    </AnimatePresence>
  );
};

export default OnboardingWalkthrough;
