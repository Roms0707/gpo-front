import { Brain, Trophy, BarChart3, Gamepad2 } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  type: 'welcome' | 'spotlight';
  targetElementId?: string;
  icon?: typeof Brain;
  titleKey: string;
  descriptionKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    type: 'welcome',
    titleKey: 'onboarding.welcome',
    descriptionKey: 'onboarding.welcomeMessage',
    position: 'center',
  },
  {
    id: 'game-hub',
    type: 'spotlight',
    targetElementId: 'walkthrough-game-hub',
    icon: Gamepad2,
    titleKey: 'onboarding.gameHub.title',
    descriptionKey: 'onboarding.gameHub.description',
    position: 'right',
  },
  {
    id: 'tournaments',
    type: 'spotlight',
    targetElementId: 'tournaments',
    icon: Trophy,
    titleKey: 'onboarding.tournaments.title',
    descriptionKey: 'onboarding.tournaments.description',
    position: 'top',
  },
  {
    id: 'gaming-stats',
    type: 'spotlight',
    targetElementId: 'walkthrough-gaming-stats',
    icon: BarChart3,
    titleKey: 'onboarding.gamingStats.title',
    descriptionKey: 'onboarding.gamingStats.description',
    position: 'bottom',
  },
];
