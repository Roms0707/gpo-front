import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ONBOARDING_STEPS, OnboardingStep } from '../constants/onboardingSteps';
import { APP_CONFIG } from '../constants';
import { scrollToElement, isElementInViewport } from '../utils/walkthroughUtils';

interface UseOnboardingWalkthroughReturn {
  isActive: boolean;
  currentStep: number;
  currentStepData: OnboardingStep | null;
  totalSteps: number;
  isWelcomeStep: boolean;
  nextStep: () => void;
  previousStep: () => void;
  skipWalkthrough: () => Promise<void>;
  completeWalkthrough: () => Promise<void>;
  goToStep: (stepIndex: number) => void;
}

export function useOnboardingWalkthrough(): UseOnboardingWalkthroughReturn {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsActive(false);
      return;
    }

    const hasCompletedOnboarding = user.has_completed_onboarding === true;
    const localCompleted = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED);

    if (!hasCompletedOnboarding && localCompleted !== 'true') {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const currentStepData = ONBOARDING_STEPS[currentStep] || null;
  const isWelcomeStep = currentStepData?.type === 'welcome';
  const totalSteps = ONBOARDING_STEPS.length;

  const scrollToTargetElement = useCallback((stepIndex: number) => {
    const step = ONBOARDING_STEPS[stepIndex];
    if (step?.targetElementId && !isElementInViewport(step.targetElementId)) {
      scrollToElement(step.targetElementId, 150);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      setTimeout(() => scrollToTargetElement(nextStepIndex), 100);
    } else {
      completeWalkthrough();
    }
  }, [currentStep, totalSteps, scrollToTargetElement]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      setTimeout(() => scrollToTargetElement(prevStepIndex), 100);
    }
  }, [currentStep, scrollToTargetElement]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
      setTimeout(() => scrollToTargetElement(stepIndex), 100);
    }
  }, [totalSteps, scrollToTargetElement]);

  const markAsCompleted = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('users')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    }
  };

  const skipWalkthrough = useCallback(async () => {
    await markAsCompleted();
    setIsActive(false);
    setCurrentStep(0);
  }, [user?.id]);

  const completeWalkthrough = useCallback(async () => {
    await markAsCompleted();
    setIsActive(false);
    setCurrentStep(0);
  }, [user?.id]);

  return {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    isWelcomeStep,
    nextStep,
    previousStep,
    skipWalkthrough,
    completeWalkthrough,
    goToStep,
  };
}
