import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOnboardingWalkthrough } from '../../hooks/useOnboardingWalkthrough';
import { OnboardingPage } from '../../constants/onboardingSteps';
import WelcomeStep from './WelcomeStep';
import WalkthroughOverlay from './WalkthroughOverlay';

interface OnboardingWalkthroughProps {
  pageName?: OnboardingPage;
}

const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({ pageName = 'home' }) => {
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    isWelcomeStep,
    nextStep,
    previousStep,
    skipWalkthrough,
  } = useOnboardingWalkthrough(pageName);

  if (!isActive || !currentStepData) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isWelcomeStep ? (
        <WelcomeStep
          key="welcome"
          onStart={nextStep}
          onSkip={skipWalkthrough}
          pageName={pageName}
        />
      ) : (
        <WalkthroughOverlay
          key={currentStepData.id}
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
