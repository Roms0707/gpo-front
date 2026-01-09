import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { OnboardingStep, OnboardingPage, getStepsForPage } from '../constants/onboardingSteps';
import { APP_CONFIG } from '../constants';
import { scrollToElement, scrollToTop, isElementInViewport } from '../utils/walkthroughUtils';

export interface OnboardingProgress {
  home: boolean;
  gameHub: boolean;
  tournament: boolean;
  gamingStats: boolean;
}

const DEFAULT_PROGRESS: OnboardingProgress = {
  home: false,
  gameHub: false,
  tournament: false,
  gamingStats: false,
};

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
  startWalkthrough: () => void;
  onboardingProgress: OnboardingProgress;
  resetPageProgress: (page: OnboardingPage) => Promise<void>;
  resetAllProgress: () => Promise<void>;
}

export function useOnboardingWalkthrough(pageName: OnboardingPage = 'home'): UseOnboardingWalkthroughReturn {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>(DEFAULT_PROGRESS);

  const steps = getStepsForPage(pageName);

  useEffect(() => {
    if (!user) {
      setIsActive(false);
      return;
    }

    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_progress, has_completed_onboarding, is_profile_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.is_profile_completed !== true) {
          return;
        }

        let progress: OnboardingProgress = DEFAULT_PROGRESS;

        if (data?.onboarding_progress) {
          progress = data.onboarding_progress as OnboardingProgress;
        } else if (data?.has_completed_onboarding === true) {
          progress = { home: true, gameHub: true, tournament: true, gamingStats: true };
        }

        setOnboardingProgress(progress);

        const localKey = `${APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED}_${pageName}`;
        const localCompleted = localStorage.getItem(localKey);
        const pageCompleted = progress[pageName] === true;

        if (!pageCompleted && localCompleted !== 'true') {
          const timer = setTimeout(() => {
            setIsActive(true);
            setCurrentStep(0);
          }, 1500);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      }
    };

    loadProgress();
  }, [user, pageName]);

  const currentStepData = steps[currentStep] || null;
  const isWelcomeStep = currentStepData?.type === 'welcome';
  const totalSteps = steps.length;

  const scrollToTargetElement = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step?.targetElementId) return;

    const scrollBehavior = step.scrollBehavior || 'scroll-to-element';

    if (scrollBehavior === 'scroll-to-top') {
      scrollToTop();
    } else if (scrollBehavior === 'scroll-to-element' && !isElementInViewport(step.targetElementId)) {
      scrollToElement(step.targetElementId, 250);
    }
  }, [steps]);

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

  const markPageAsCompleted = async () => {
    if (!user?.id) return;

    try {
      const newProgress = { ...onboardingProgress, [pageName]: true };

      await supabase
        .from('users')
        .update({ onboarding_progress: newProgress })
        .eq('id', user.id);

      setOnboardingProgress(newProgress);

      const localKey = `${APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED}_${pageName}`;
      localStorage.setItem(localKey, 'true');
    } catch (error) {
      console.error('Failed to mark page onboarding as completed:', error);
      const localKey = `${APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED}_${pageName}`;
      localStorage.setItem(localKey, 'true');
    }
  };

  const skipWalkthrough = useCallback(async () => {
    await markPageAsCompleted();
    setIsActive(false);
    setCurrentStep(0);
  }, [user?.id, pageName, onboardingProgress]);

  const completeWalkthrough = useCallback(async () => {
    await markPageAsCompleted();
    setIsActive(false);
    setCurrentStep(0);
  }, [user?.id, pageName, onboardingProgress]);

  const startWalkthrough = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const resetPageProgress = useCallback(async (page: OnboardingPage) => {
    if (!user?.id) return;

    try {
      const newProgress = { ...onboardingProgress, [page]: false };

      await supabase
        .from('users')
        .update({ onboarding_progress: newProgress })
        .eq('id', user.id);

      setOnboardingProgress(newProgress);

      const localKey = `${APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED}_${page}`;
      localStorage.removeItem(localKey);
    } catch (error) {
      console.error('Failed to reset page onboarding progress:', error);
    }
  }, [user?.id, onboardingProgress]);

  const resetAllProgress = useCallback(async () => {
    if (!user?.id) return;

    try {
      const newProgress: OnboardingProgress = {
        home: false,
        gameHub: false,
        tournament: false,
        gamingStats: false,
      };

      await supabase
        .from('users')
        .update({
          onboarding_progress: newProgress,
          has_completed_onboarding: false
        })
        .eq('id', user.id);

      setOnboardingProgress(newProgress);

      Object.keys(newProgress).forEach(page => {
        const localKey = `${APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED}_${page}`;
        localStorage.removeItem(localKey);
      });
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ONBOARDING_COMPLETED);
    } catch (error) {
      console.error('Failed to reset all onboarding progress:', error);
    }
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
    startWalkthrough,
    onboardingProgress,
    resetPageProgress,
    resetAllProgress,
  };
}
