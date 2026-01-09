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
  Check,
  Gamepad2,
  Car,
  Layers,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useGameCoachingConfig, StatsPlatform } from '../../hooks/useGameCoachingConfig';
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
  external_stats_validated?: boolean;
  external_stats_cached_data?: any;
}

type GameCategory = 'moba' | 'fps' | 'battle_royale' | 'fighting' | 'sports' | 'racing' | 'card' | 'hero_shooter' | 'autobattler' | 'default';

const getFieldIcon = (category: string) => {
  switch (category) {
    case 'sports':
    case 'racing':
      return Gamepad2;
    case 'card':
    case 'autobattler':
      return Layers;
    default:
      return Sword;
  }
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
  const { config, isLoading: configLoading } = useGameCoachingConfig(gameId, gameName);

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRankDropdown, setShowRankDropdown] = useState(false);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [statsFetchError, setStatsFetchError] = useState<string | null>(null);
  const [statsValidated, setStatsValidated] = useState(existingProfile?.external_stats_validated || false);

  const [profile, setProfile] = useState<ManualProfile>({
    self_reported_rank: existingProfile?.self_reported_rank || null,
    external_stats_url: existingProfile?.external_stats_url || null,
    external_stats_platform: existingProfile?.external_stats_platform || null,
    main_characters: existingProfile?.main_characters || [],
    playstyle_notes: existingProfile?.playstyle_notes || null,
    hours_played_estimate: existingProfile?.hours_played_estimate || null,
  });

  const [characterInput, setCharacterInput] = useState('');

  const FieldIcon = config ? getFieldIcon(config.game_category) : Sword;
  const rankOptions = config?.rank_tiers || ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional'];
  const statsPlatforms = config?.stats_platforms || [];
  const characterLabel = config?.character_field_label || t('coaching.fieldLabel.default');
  const characterPlaceholder = config?.character_field_placeholder || t('coaching.fieldPlaceholder.default');

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
      setStatsValidated(existingProfile.external_stats_validated || false);
    }
  }, [existingProfile]);

  useEffect(() => {
    if (config && statsPlatforms.length > 0 && !profile.external_stats_platform) {
      setProfile(prev => ({
        ...prev,
        external_stats_platform: statsPlatforms[0].platform
      }));
    }
  }, [config, statsPlatforms, profile.external_stats_platform]);

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

  const handleFetchStats = async () => {
    if (!profile.external_stats_url || !profile.external_stats_platform || !user) return;

    setIsFetchingStats(true);
    setStatsFetchError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-external-stats`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: profile.external_stats_url,
            platform: profile.external_stats_platform,
            game_id: gameId,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        if (result.errorType === 'rate_limited') {
          setStatsFetchError(`${t('coaching.rateLimited')} ${result.retryAfter} ${t('common.minutes')}`);
        } else {
          setStatsFetchError(result.error || t('coaching.fetchStatsFailed'));
        }
        return;
      }

      setStatsValidated(true);
      toast.success(t('coaching.statsValidated'));
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setStatsFetchError(error.message || t('coaching.fetchStatsFailed'));
    } finally {
      setIsFetchingStats(false);
    }
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

  const getSelectedPlatform = (): StatsPlatform | null => {
    if (!profile.external_stats_platform || statsPlatforms.length === 0) return null;
    return statsPlatforms.find(p => p.platform === profile.external_stats_platform) || null;
  };

  const selectedPlatform = getSelectedPlatform();

  if (configLoading) {
    return (
      <div className="bg-dark-200/50 border border-gray-800 rounded-xl p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

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
            {statsPlatforms.length > 0 && (
              <button
                onClick={() => setShowGuideModal(true)}
                className="flex items-center gap-1 text-xs hover:underline"
                style={{ color: theme.colors.primary }}
              >
                <HelpCircle className="w-3 h-3" />
                {t('coaching.howToFind')}
              </button>
            )}
          </div>

          {statsPlatforms.length === 0 ? (
            <div className="p-4 bg-dark-300/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50">
                  <Link2 className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{t('coaching.noPlatformAvailable')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('coaching.noPlatformAvailableDesc')}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2 flex-wrap">
                {statsPlatforms.map(platform => (
                  <button
                    key={platform.platform}
                    onClick={() => {
                      setProfile(prev => ({ ...prev, external_stats_platform: platform.platform }));
                      setStatsValidated(false);
                      setStatsFetchError(null);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      profile.external_stats_platform === platform.platform
                        ? 'border-transparent text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: profile.external_stats_platform === platform.platform
                        ? theme.colors.primary
                        : 'transparent'
                    }}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    value={profile.external_stats_url || ''}
                    onChange={(e) => {
                      setProfile(prev => ({ ...prev, external_stats_url: e.target.value }));
                      setStatsValidated(false);
                      setStatsFetchError(null);
                    }}
                    placeholder={selectedPlatform?.url_example || 'https://...'}
                    className="w-full pl-10 pr-4 py-3 bg-dark-300 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                  />
                </div>
                {profile.external_stats_url && profile.external_stats_platform && (
                  <button
                    onClick={handleFetchStats}
                    disabled={isFetchingStats}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: statsValidated ? '#22c55e20' : `${theme.colors.primary}20`,
                      color: statsValidated ? '#22c55e' : theme.colors.primary,
                    }}
                  >
                    {isFetchingStats ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : statsValidated ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">
                      {statsValidated ? t('coaching.validated') : t('coaching.fetchStats')}
                    </span>
                  </button>
                )}
              </div>

              {statsFetchError && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400">{statsFetchError}</p>
                    <ul className="mt-1 text-xs text-gray-400 list-disc list-inside">
                      <li>{t('coaching.troubleshooting.checkUrl')}</li>
                      <li>{t('coaching.troubleshooting.checkPublic')}</li>
                    </ul>
                  </div>
                </div>
              )}

              {statsValidated && (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-green-400">{t('coaching.statsValidatedSuccess')}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {characterLabel}
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
              <FieldIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
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
                placeholder={characterPlaceholder}
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
