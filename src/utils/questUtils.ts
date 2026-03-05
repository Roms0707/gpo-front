import {
  UserCircle,
  Trophy,
  Users,
  Swords,
  Gamepad2,
  CalendarCheck,
  CalendarDays,
  Star,
} from 'lucide-react';
import type { QuestType } from '../types/quest';

export function getQuestTypeIcon(questType: QuestType) {
  switch (questType) {
    case 'profile_completion': return UserCircle;
    case 'tournament_participation': return Trophy;
    case 'social_share': return Users;
    case 'win_match': return Swords;
    case 'play_game': return Gamepad2;
    case 'daily': return CalendarCheck;
    case 'weekly': return CalendarDays;
    case 'custom': return Star;
    default: return Star;
  }
}

export type XpTier = 'low' | 'medium' | 'high' | 'premium';

export function getQuestXpTier(xpReward: number): XpTier {
  if (xpReward >= 200) return 'premium';
  if (xpReward >= 100) return 'high';
  if (xpReward >= 50) return 'medium';
  return 'low';
}

export function getQuestProgressPercent(progress: string, targetValue: string): number {
  const current = parseInt(progress, 10) || 0;
  const target = parseInt(targetValue, 10) || 1;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function getXpTierColors(tier: XpTier): { bg: string; text: string; glow: string } {
  switch (tier) {
    case 'premium':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/30 shadow-lg' };
    case 'high':
      return { bg: 'bg-sky-500/20', text: 'text-sky-400', glow: 'shadow-sky-500/20 shadow-md' };
    case 'medium':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: '' };
    case 'low':
    default:
      return { bg: 'bg-gray-500/20', text: 'text-gray-400', glow: '' };
  }
}
