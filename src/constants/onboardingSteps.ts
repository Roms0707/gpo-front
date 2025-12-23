import { Brain, Trophy, BarChart3, Gamepad2, Target, Users, Award, Zap, BookOpen, TrendingUp, Play, Crosshair } from 'lucide-react';

export type OnboardingPage = 'home' | 'gameHub' | 'tournament' | 'gamingStats';

export type ScrollBehavior = 'scroll-to-element' | 'scroll-to-top' | 'none';

export interface OnboardingStep {
  id: string;
  type: 'welcome' | 'spotlight';
  page: OnboardingPage;
  targetElementId?: string;
  icon?: typeof Brain;
  titleKey: string;
  descriptionKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  scrollBehavior?: ScrollBehavior;
  fallbackTabId?: string;
  fallbackMessageKey?: string;
}

export const HOME_STEPS: OnboardingStep[] = [
  {
    id: 'home-welcome',
    type: 'welcome',
    page: 'home',
    titleKey: 'onboarding.home.welcome',
    descriptionKey: 'onboarding.home.welcomeMessage',
    position: 'center',
  },
  {
    id: 'home-game-hub',
    type: 'spotlight',
    page: 'home',
    targetElementId: 'walkthrough-game-hub',
    icon: Gamepad2,
    titleKey: 'onboarding.home.gameHub.title',
    descriptionKey: 'onboarding.home.gameHub.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-top',
  },
  {
    id: 'home-tournaments',
    type: 'spotlight',
    page: 'home',
    targetElementId: 'walkthrough-tournaments',
    icon: Trophy,
    titleKey: 'onboarding.home.tournaments.title',
    descriptionKey: 'onboarding.home.tournaments.description',
    position: 'top',
    scrollBehavior: 'scroll-to-element',
  },
  {
    id: 'home-gaming-stats',
    type: 'spotlight',
    page: 'home',
    targetElementId: 'walkthrough-gaming-stats',
    icon: BarChart3,
    titleKey: 'onboarding.home.gamingStats.title',
    descriptionKey: 'onboarding.home.gamingStats.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-top',
  },
];

export const GAME_HUB_STEPS: OnboardingStep[] = [
  {
    id: 'gamehub-welcome',
    type: 'welcome',
    page: 'gameHub',
    titleKey: 'onboarding.gameHub.welcome',
    descriptionKey: 'onboarding.gameHub.welcomeMessage',
    position: 'center',
  },
  {
    id: 'gamehub-carousel',
    type: 'spotlight',
    page: 'gameHub',
    targetElementId: 'walkthrough-gamehub-carousel',
    icon: Gamepad2,
    titleKey: 'onboarding.gameHub.carousel.title',
    descriptionKey: 'onboarding.gameHub.carousel.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-top',
  },
  {
    id: 'gamehub-tabs',
    type: 'spotlight',
    page: 'gameHub',
    targetElementId: 'walkthrough-gamehub-tabs',
    icon: BookOpen,
    titleKey: 'onboarding.gameHub.tabs.title',
    descriptionKey: 'onboarding.gameHub.tabs.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-element',
  },
  {
    id: 'gamehub-coaching',
    type: 'spotlight',
    page: 'gameHub',
    targetElementId: 'walkthrough-gamehub-coaching',
    icon: Brain,
    titleKey: 'onboarding.gameHub.coaching.title',
    descriptionKey: 'onboarding.gameHub.coaching.description',
    position: 'top',
    scrollBehavior: 'scroll-to-element',
    fallbackTabId: 'walkthrough-tab-coaching',
    fallbackMessageKey: 'onboarding.gameHub.coaching.clickTab',
  },
  {
    id: 'gamehub-training',
    type: 'spotlight',
    page: 'gameHub',
    targetElementId: 'walkthrough-gamehub-training',
    icon: Target,
    titleKey: 'onboarding.gameHub.training.title',
    descriptionKey: 'onboarding.gameHub.training.description',
    position: 'top',
    scrollBehavior: 'scroll-to-element',
  },
];

export const TOURNAMENT_STEPS: OnboardingStep[] = [
  {
    id: 'tournament-welcome',
    type: 'welcome',
    page: 'tournament',
    titleKey: 'onboarding.tournament.welcome',
    descriptionKey: 'onboarding.tournament.welcomeMessage',
    position: 'center',
  },
  {
    id: 'tournament-info',
    type: 'spotlight',
    page: 'tournament',
    targetElementId: 'walkthrough-tournament-hero',
    icon: Trophy,
    titleKey: 'onboarding.tournament.info.title',
    descriptionKey: 'onboarding.tournament.info.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-top',
  },
  {
    id: 'tournament-tabs',
    type: 'spotlight',
    page: 'tournament',
    targetElementId: 'walkthrough-tournament-tabs',
    icon: BookOpen,
    titleKey: 'onboarding.tournament.tabs.title',
    descriptionKey: 'onboarding.tournament.tabs.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-element',
  },
  {
    id: 'tournament-register',
    type: 'spotlight',
    page: 'tournament',
    targetElementId: 'walkthrough-tournament-register',
    icon: Play,
    titleKey: 'onboarding.tournament.register.title',
    descriptionKey: 'onboarding.tournament.register.description',
    position: 'left',
    scrollBehavior: 'scroll-to-element',
  },
  {
    id: 'tournament-rewards',
    type: 'spotlight',
    page: 'tournament',
    targetElementId: 'walkthrough-tournament-rewards',
    icon: Award,
    titleKey: 'onboarding.tournament.rewards.title',
    descriptionKey: 'onboarding.tournament.rewards.description',
    position: 'top',
    scrollBehavior: 'scroll-to-element',
  },
];

export const GAMING_STATS_STEPS: OnboardingStep[] = [
  {
    id: 'stats-welcome',
    type: 'welcome',
    page: 'gamingStats',
    titleKey: 'onboarding.gamingStats.welcome',
    descriptionKey: 'onboarding.gamingStats.welcomeMessage',
    position: 'center',
  },
  {
    id: 'stats-overview',
    type: 'spotlight',
    page: 'gamingStats',
    targetElementId: 'walkthrough-stats-overview',
    icon: TrendingUp,
    titleKey: 'onboarding.gamingStats.overview.title',
    descriptionKey: 'onboarding.gamingStats.overview.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-top',
  },
  {
    id: 'stats-accounts',
    type: 'spotlight',
    page: 'gamingStats',
    targetElementId: 'walkthrough-stats-accounts',
    icon: Users,
    titleKey: 'onboarding.gamingStats.accounts.title',
    descriptionKey: 'onboarding.gamingStats.accounts.description',
    position: 'top',
    scrollBehavior: 'scroll-to-element',
  },
  {
    id: 'stats-tabs',
    type: 'spotlight',
    page: 'gamingStats',
    targetElementId: 'walkthrough-stats-tabs',
    icon: Gamepad2,
    titleKey: 'onboarding.gamingStats.tabs.title',
    descriptionKey: 'onboarding.gamingStats.tabs.description',
    position: 'bottom',
    scrollBehavior: 'scroll-to-element',
  },
  {
    id: 'stats-aim-trainer',
    type: 'spotlight',
    page: 'gamingStats',
    targetElementId: 'walkthrough-stats-aim-trainer',
    icon: Crosshair,
    titleKey: 'onboarding.gamingStats.aimTrainer.title',
    descriptionKey: 'onboarding.gamingStats.aimTrainer.description',
    position: 'top',
    scrollBehavior: 'scroll-to-element',
    fallbackTabId: 'walkthrough-tab-aim-trainer',
    fallbackMessageKey: 'onboarding.gamingStats.aimTrainer.clickTab',
  },
  {
    id: 'stats-performance',
    type: 'spotlight',
    page: 'gamingStats',
    targetElementId: 'walkthrough-stats-performance',
    icon: Zap,
    titleKey: 'onboarding.gamingStats.performance.title',
    descriptionKey: 'onboarding.gamingStats.performance.description',
    position: 'top',
    scrollBehavior: 'scroll-to-element',
  },
];

export const ALL_ONBOARDING_STEPS: Record<OnboardingPage, OnboardingStep[]> = {
  home: HOME_STEPS,
  gameHub: GAME_HUB_STEPS,
  tournament: TOURNAMENT_STEPS,
  gamingStats: GAMING_STATS_STEPS,
};

export function getStepsForPage(page: OnboardingPage): OnboardingStep[] {
  return ALL_ONBOARDING_STEPS[page] || [];
}

export const ONBOARDING_STEPS: OnboardingStep[] = HOME_STEPS;
