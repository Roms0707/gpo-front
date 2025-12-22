import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Link2,
  Sword,
  Clock,
  Save,
  X,
  HelpCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ExternalStatsGuideModal from './ExternalStatsGuideModal';

interface ManualGameProfileSetupProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
  onProfileSaved?: () => void;
  onCancel?: () => void;
  existingProfile?: ManualProfile | null;
}

interface ManualProfile {
  id?: string;
  self_reported_rank: string | null;
  external_stats_url: string | null;
  external_stats_platform: string | null;
  main_characters: string[];
  playstyle_notes: string | null;
  hours_played_estimate: number | null;
}

const RANK_OPTIONS: Record<string, string[]> = {
  default: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional'],
  moba: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
  fps: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
  battle_royale: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'],
  fighting: ['Rookie', 'Beginner', 'Intermediate', 'Advanced', 'Master', 'Legend'],
};

const STATS_PLATFORMS = [
  { id: 'op.gg', name: 'OP.GG', games: ['league of legends', 'lol', 'valorant', 'tft'] },
  { id: 'tracker.gg', name: 'Tracker.gg', games: ['valorant', 'fortnite', 'apex legends', 'rocket league', 'cs2', 'overwatch'] },
  { id: 'blitz.gg', name: 'Blitz.gg', games: ['league of legends', 'lol', 'valorant', 'tft'] },
  { id: 'u.gg', name: 'U.GG', games: ['league of legends', 'lol'] },
  { id: 'leetify', name: 'Leetify', games: ['cs2', 'counter-strike'] },
  { id: 'other', name: 'Other', games: [] },
];

const detectGameCategory = (gameName: string): string => {
  const lowerName = gameName.toLowerCase();
  if (lowerName.includes('league') || lowerName.includes('dota')) return 'moba';
  if (lowerName.includes('valorant') || lowerName.includes('cs') || lowerName.includes('counter-strike')) return 'fps';
  if (lowerName.includes('fortnite') || lowerName.includes('apex') || lowerName.includes('pubg')) return 'battle_royale';
  if (lowerName.includes('street fighter') || lowerName.includes('tekken') || lowerName.includes('mortal')) return 'fighting';
  return 'default';
};

const ManualGameProfileSetup: React.FC<ManualGameProfileSetupProps> = ({
  gameId,
  gameName,
  theme,
  onProfileSaved,
  onCancel,
  existingProfile
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRankDropdown, setShowRankDropdown] = useState(false);

  const [profile, setProfile] = useState<ManualProfile>({
    self_reported_rank: existingProfile?.self_reported_rank || null,
    external_stats_url: existingProfile?.external_stats_url || null,
    external_stats_platform: existingProfile?.external_stats_platform || null,
    main_characters: existingProfile?.main_characters || [],
    playstyle_notes: existingProfile?.playstyle_notes || null,
    hours_played_estimate: existingProfile?.hours_played_estimate || null,
  });

  const [characterInput, setCharacterInput] = useState('');

  const gameCategory = detectGameCategory(gameName);
  const rankOptions = RANK_OPTIONS[gameCategory] || RANK_OPTIONS.default;

  const relevantPlatforms = STATS_PLATFORMS.filter(
    p => p.games.length === 0 || p.games.some(g => gameName.toLowerCase().includes(g))
  );

  useEffect(() => {
    if (existingProfile) {
      setProfile({
        self_reported_rank: existingProfile.self_reported_rank,
        external_stats_url: existingProfile.external_stats_url,
        external_stats_platform: existingProfile.external_stats_platform,
        main_characters: existingProfile.main_characters || [],
        playstyle_notes: existingProfile.playstyle_notes,
        hours_played_estimate: existingProfile.hours_played_estimate,
      });
    }
  }, [existingProfile]);

  const handleAddCharacter = () => {
    if (characterInput.trim() && !profile.main_characters.includes(characterInput.trim())) {
      setProfile(prev => ({
        ...prev,
        main_characters: [...prev.main_characters, characterInput.trim()]
      }));
      setCharacterInput('');
    }
  };

  const handleRemoveCharacter = (char: string) => {
    setProfile(prev => ({
      ...prev,
      main_characters: prev.main_characters.filter(c => c !== char)
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        game_id: gameId,
        self_reported_rank: profile.self_reported_rank,
        external_stats_url: profile.external_stats_url,
        external_stats_platform: profile.external_stats_platform,
        main_characters: profile.main_characters,
        playstyle_notes: profile.playstyle_notes,
        hours_played_estimate: profile.hours_played_estimate,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_game_manual_profiles')
        .upsert(profileData, {
          onConflict: 'user_id,game_id'
        });

      if (error) throw error;

      toast.success(t('coaching.profileSaved'));
      onProfileSaved?.();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('coaching.profileSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('coaching.setupProfile')}</h3>
            <p className="text-sm text-gray-400">{t('coaching.setupProfileDesc')}</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('coaching.yourRank')}
          </label>
          <div className="relative">
            <button
              onClick={() => setShowRankDropdown(!showRankDropdown)}
              className="w-full flex items-center justify-between p-3 bg-dark-300 border border-gray-700 rounded-lg text-left hover:border-gray-600 transition-colors"
            >
              <span className={profile.self_reported_rank ? 'text-white' : 'text-gray-500'}>
                {profile.self_reported_rank || t('coaching.selectRank')}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showRankDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showRankDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-dark-300 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {rankOptions.map(rank => (
                  <button
                    key={rank}
                    onClick={() => {
                      setProfile(prev => ({ ...prev, self_reported_rank: rank }));
                      setShowRankDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-dark-200 transition-colors"
                  >
                    <span className="text-white">{rank}</span>
                    {profile.self_reported_rank === rank && (
                      <Check className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-700 p-2">
                  <input
                    type="text"
                    placeholder={t('coaching.customRank')}
                    className="w-full p-2 bg-dark-400 border border-gray-600 rounded text-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        setProfile(prev => ({ ...prev, self_reported_rank: e.currentTarget.value.trim() }));
                        setShowRankDropdown(false);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              {t('coaching.externalStatsUrl')}
            </label>
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: theme.colors.primary }}
            >
              <HelpCircle className="w-3 h-3" />
              {t('coaching.howToFind')}
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            {relevantPlatforms.map(platform => (
              <button
                key={platform.id}
                onClick={() => setProfile(prev => ({ ...prev, external_stats_platform: platform.id }))}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  profile.external_stats_platform === platform.id
                    ? 'border-transparent text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
                style={{
                  backgroundColor: profile.external_stats_platform === platform.id
                    ? theme.colors.primary
                    : 'transparent'
                }}
              >
                {platform.name}
              </button>
            ))}
          </div>

          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={profile.external_stats_url || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, external_stats_url: e.target.value }))}
              placeholder="https://tracker.gg/valorant/profile/..."
              className="w-full pl-10 pr-4 py-3 bg-dark-300 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('coaching.mainCharacters')}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {profile.main_characters.map(char => (
              <span
                key={char}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
              >
                {char}
                <button
                  onClick={() => handleRemoveCharacter(char)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Sword className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={characterInput}
                onChange={(e) => setCharacterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCharacter();
                  }
                }}
                placeholder={t('coaching.addCharacter')}
                className="w-full pl-10 pr-4 py-2 bg-dark-300 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
            </div>
            <button
              onClick={handleAddCharacter}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
            >
              {t('common.add')}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('coaching.hoursPlayed')}
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="number"
              value={profile.hours_played_estimate || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                hours_played_estimate: e.target.value ? parseInt(e.target.value) : null
              }))}
              placeholder="500"
              min="0"
              className="w-full pl-10 pr-4 py-3 bg-dark-300 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('coaching.playstyleNotes')}
          </label>
          <textarea
            value={profile.playstyle_notes || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, playstyle_notes: e.target.value }))}
            placeholder={t('coaching.playstyleNotesPlaceholder')}
            rows={3}
            className="w-full p-3 bg-dark-300 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.text
          }}
        >
          <Save className="w-5 h-5" />
          {isSaving ? t('common.saving') : t('coaching.saveProfile')}
        </button>
      </div>

      {showGuideModal && (
        <ExternalStatsGuideModal
          gameName={gameName}
          theme={theme}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </div>
  );
};

export default ManualGameProfileSetup;
