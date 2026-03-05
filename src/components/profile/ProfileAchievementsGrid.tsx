import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Lock, Zap } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
  unlocked_at?: string;
}

interface ProfileAchievementsGridProps {
  achievements: Achievement[];
  theme: GameTheme;
  isLoading?: boolean;
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-gray-700/30', border: 'border-gray-600', text: 'text-gray-400', glow: '' },
  rare: { bg: 'bg-blue-900/20', border: 'border-blue-700/50', text: 'text-blue-400', glow: '0 0 12px rgba(59,130,246,0.2)' },
  epic: { bg: 'bg-teal-900/20', border: 'border-teal-600/50', text: 'text-teal-400', glow: '0 0 12px rgba(20,184,166,0.2)' },
  legendary: { bg: 'bg-amber-900/20', border: 'border-amber-600/50', text: 'text-amber-400', glow: '0 0 15px rgba(245,158,11,0.3)' },
};

const ProfileAchievementsGrid: React.FC<ProfileAchievementsGridProps> = ({
  achievements,
  theme,
  isLoading = false
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">
          {t('profile.noAchievements', 'No Achievements Yet')}
        </h3>
        <p className="text-sm text-gray-400">
          {t('profile.noAchievementsDesc', 'Start playing to unlock achievements!')}
        </p>
      </div>
    );
  }

  const sorted = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return (rarityOrder[a.rarity] || 3) - (rarityOrder[b.rarity] || 3);
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">{unlockedCount}</span>
          {' / '}{achievements.length}{' '}
          {t('profile.achievementsUnlocked', 'unlocked')}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sorted.map((achievement) => {
          const rarity = rarityColors[achievement.rarity] || rarityColors.common;

          return (
            <div
              key={achievement.id}
              className={`relative rounded-xl p-4 border transition-all ${
                achievement.unlocked
                  ? `${rarity.bg} ${rarity.border}`
                  : 'bg-gray-800/30 border-gray-800 opacity-50'
              }`}
              style={achievement.unlocked && rarity.glow ? { boxShadow: rarity.glow } : {}}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  achievement.unlocked ? rarity.bg : 'bg-gray-800'
                }`}>
                  {achievement.unlocked ? (
                    <Award className={`w-5 h-5 ${rarity.text}`} />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${
                    achievement.unlocked ? 'text-white' : 'text-gray-500'
                  } line-clamp-1`}>
                    {achievement.name}
                  </p>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
                    {achievement.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className={`w-3 h-3 ${rarity.text}`} />
                  <span className={`text-[10px] font-medium ${rarity.text}`}>
                    +{achievement.xp_reward} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileAchievementsGrid;
