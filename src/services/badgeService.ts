import { Sparkles, Flame, TrendingUp, Star, Zap, Eye, LucideIcon } from 'lucide-react';

export type BadgeType = 'new' | 'hype' | 'trending' | 'featured' | 'hot' | 'must_watch';

export interface BadgeDefinition {
  type: BadgeType;
  labelKey: string;
  fallbackLabel: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  glowColor: string;
}

export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  new: {
    type: 'new',
    labelKey: 'badges.new',
    fallbackLabel: 'New',
    icon: Sparkles,
    bgColor: 'rgba(16, 185, 129, 0.85)',
    textColor: '#ffffff',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  hype: {
    type: 'hype',
    labelKey: 'badges.hype',
    fallbackLabel: 'Hype',
    icon: Flame,
    bgColor: 'rgba(245, 158, 11, 0.85)',
    textColor: '#ffffff',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  trending: {
    type: 'trending',
    labelKey: 'badges.trending',
    fallbackLabel: 'Trending',
    icon: TrendingUp,
    bgColor: 'rgba(14, 165, 233, 0.85)',
    textColor: '#ffffff',
    glowColor: 'rgba(14, 165, 233, 0.3)',
  },
  featured: {
    type: 'featured',
    labelKey: 'badges.featured',
    fallbackLabel: 'Featured',
    icon: Star,
    bgColor: 'rgba(249, 115, 22, 0.85)',
    textColor: '#ffffff',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  hot: {
    type: 'hot',
    labelKey: 'badges.hot',
    fallbackLabel: 'Hot',
    icon: Zap,
    bgColor: 'rgba(239, 68, 68, 0.85)',
    textColor: '#ffffff',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  must_watch: {
    type: 'must_watch',
    labelKey: 'badges.mustWatch',
    fallbackLabel: 'Must Watch',
    icon: Eye,
    bgColor: 'rgba(20, 184, 166, 0.85)',
    textColor: '#ffffff',
    glowColor: 'rgba(20, 184, 166, 0.3)',
  },
};

const BADGE_POOL: BadgeType[] = ['new', 'hype', 'trending', 'featured', 'hot', 'must_watch'];
const ASSIGNMENT_RATE = 0.35;

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getBadgesForContent(contentId: string): BadgeType[] {
  const hash = hashString(contentId);
  const normalized = (hash % 1000) / 1000;

  if (normalized > ASSIGNMENT_RATE) return [];

  const badgeIndex = hash % BADGE_POOL.length;
  return [BADGE_POOL[badgeIndex]];
}

export function getBadgesForRubric(rubricId: string): BadgeType[] {
  const hash = hashString(rubricId);
  const normalized = (hash % 1000) / 1000;

  if (normalized > 0.45) return [];

  const badgeIndex = hash % BADGE_POOL.length;
  return [BADGE_POOL[badgeIndex]];
}

export function computeBadgeCounts<T>(
  items: T[],
  getBadges: (item: T) => BadgeType[]
): Record<BadgeType, number> {
  const counts = Object.fromEntries(
    BADGE_POOL.map(b => [b, 0])
  ) as Record<BadgeType, number>;

  for (const item of items) {
    for (const badge of getBadges(item)) {
      counts[badge]++;
    }
  }

  return counts;
}

export function getPrimaryBadge(badges: BadgeType[]): BadgeType | null {
  if (badges.length === 0) return null;
  const priority: BadgeType[] = ['hot', 'hype', 'trending', 'featured', 'must_watch', 'new'];
  for (const p of priority) {
    if (badges.includes(p)) return p;
  }
  return badges[0];
}
