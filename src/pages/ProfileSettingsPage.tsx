import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Save,
  Gamepad2,
  CheckCircle,
  Loader,
  AlertCircle,
  Settings,
  Link2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateRiotId } from '../services/api';
import toast from 'react-hot-toast';
import SteamAccountIntegration from '../components/profile/SteamAccountIntegration';
import FortniteAccountIntegration from '../components/profile/FortniteAccountIntegration';
import RiotAccountIntegration from '../components/profile/RiotAccountIntegration';
import DiscordOAuthIntegration from '../components/profile/DiscordOAuthIntegration';
import { usePlayerPrimaryGame } from '../hooks/usePlayerPrimaryGame';
import { getGameTheme } from '../utils/gameThemes';
import { Game } from '../types';

interface GamePublisherField {
  id: string;
  game_id: string;
  label: string;
  id_name: string;
  required: boolean;
  value?: string;
  isValidating?: boolean;
  isValidated?: boolean;
  validation_data?: any;
  validation_date?: string;
  gameName?: string;
  publisherLabel?: string;
}

interface SettingsCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor?: string;
  validatedCount?: number;
  totalCount?: number;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
  accentColor = '#3b82f6',
  validatedCount = 0,
  totalCount = 0
}) => {
  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{ borderColor: `${accentColor}30` }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between transition-colors hover:bg-white/5"
        style={{ backgroundColor: `${accentColor}08` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {totalCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {validatedCount}/{totalCount} validated
                </span>
                {validatedCount === totalCount && totalCount > 0 && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {validatedCount > 0 && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${accentColor}15`,
                color: accentColor
              }}
            >
              {validatedCount} linked
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div
          className="p-5 border-t bg-white dark:bg-dark-100"
          style={{ borderColor: `${accentColor}20` }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const ProfileSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamePublisherFields, setGamePublisherFields] = useState<GamePublisherField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>('discord');
  const [steamData, setSteamData] = useState({ value: '', isValidated: false, validationData: null });
  const [fortniteData, setFortniteData] = useState({
    value: user?.fortnite_epic_id || '',
    isValidated: user?.is_fortnite_validated || false,
    validationData: user?.fortnite_validation_data || null
  });
  const [favoriteGame, setFavoriteGame] = useState<Game | null>(null);

  useEffect(() => {
    const loadFavoriteGame = async () => {
      if (!user?.favorite_game_id) {
        setFavoriteGame(null);
        return;
      }

      try {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('id', user.favorite_game_id)
          .maybeSingle();

        setFavoriteGame(data);
      } catch (error) {
        console.error('Error loading favorite game:', error);
      }
    };

    loadFavoriteGame();
  }, [user?.favorite_game_id]);

  const { theme } = usePlayerPrimaryGame({
    playerRankings: [],
    registrations: [],
    gamingAccounts: [],
    favoriteGameId: user?.favorite_game_id || null,
    favoriteGameName: favoriteGame?.name || null
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadGamePublisherFields();
    loadSteamId64();
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      setFortniteData({
        value: user.fortnite_epic_id || '',
        isValidated: user.is_fortnite_validated || false,
        validationData: user.fortnite_validation_data || null
      });
    }
  }, [user]);

  const loadSteamId64 = async () => {
    if (!user?.id) return;

    try {
      const { data: steamGame } = await supabase
        .from('games')
        .select('id')
        .ilike('name', '%steam%')
        .maybeSingle();

      if (!steamGame) return;

      const { data: steamPublisher } = await supabase
        .from('game_publisher_ids')
        .select('id')
        .eq('game_id', steamGame.id)
        .ilike('label', '%steam%')
        .maybeSingle();

      if (!steamPublisher) return;

      const { data: userSteamData } = await supabase
        .from('game_publisher_id_for_users')
        .select('value, is_validated, validation_data')
        .eq('user_id', user.id)
        .eq('game_publisher_id', steamPublisher.id)
        .maybeSingle();

      if (userSteamData) {
        setSteamData({
          value: userSteamData.value,
          isValidated: userSteamData.is_validated || false,
          validationData: userSteamData.validation_data
        });
      }
    } catch (error) {
      console.error('Error loading SteamID64:', error);
    }
  };

  const loadGamePublisherFields = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingFields(true);

      const { data: publisherIds, error: publisherError } = await supabase
        .from('game_publisher_ids')
        .select(`
          id,
          label,
          id_name,
          required,
          game_id,
          games:game_id (
            name,
            has_an_api
          )
        `)
        .order('label', { ascending: true });

      if (publisherError || !publisherIds) {
        setGamePublisherFields([]);
        return;
      }

      const { data: userValues } = await supabase
        .from('game_publisher_id_for_users')
        .select(`
          game_publisher_id,
          value,
          is_validated,
          validation_data,
          validation_date
        `)
        .eq('user_id', user.id);

      const existingValues = new Map();
      (userValues || []).forEach((item) => {
        existingValues.set(item.game_publisher_id, {
          value: item.value,
          isValidated: item.is_validated,
          validation_data: item.validation_data,
          validation_date: item.validation_date
        });
      });

      const fields: GamePublisherField[] = publisherIds.map((item) => {
        const existing = existingValues.get(item.id);
        return {
          id: item.id,
          game_id: item.game_id,
          label: item.label,
          id_name: item.id_name,
          required: item.required,
          value: existing?.value || '',
          isValidated: existing?.isValidated || false,
          validation_data: existing?.validation_data,
          validation_date: existing?.validation_date,
          gameName: item.games?.name || 'Unknown Game',
          publisherLabel: item.label
        };
      });

      setGamePublisherFields(fields);
    } catch (error) {
      console.error('Error loading game publisher fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const saveSteamId64 = async () => {
    if (!user?.id || !steamData.value) return;

    try {
      const { data: steamGame } = await supabase
        .from('games')
        .select('id')
        .ilike('name', '%steam%')
        .maybeSingle();

      if (!steamGame) return;

      const { data: steamPublisher } = await supabase
        .from('game_publisher_ids')
        .select('id')
        .eq('game_id', steamGame.id)
        .ilike('label', '%steam%')
        .maybeSingle();

      if (!steamPublisher) return;

      await supabase.from('game_publisher_id_for_users').upsert(
        [
          {
            user_id: user.id,
            game_id: steamGame.id,
            game_publisher_id: steamPublisher.id,
            value: steamData.value,
            is_validated: steamData.isValidated,
            validation_data: steamData.validationData,
            validation_date: steamData.isValidated ? new Date().toISOString() : null,
            validation_source: steamData.isValidated ? 'steam_api' : null
          }
        ],
        { onConflict: 'user_id,game_publisher_id' }
      );
    } catch (error) {
      console.error('Error saving SteamID64:', error);
      throw error;
    }
  };

  const saveGamePublisherAccounts = async () => {
    if (!user?.id) return;

    const fieldsWithValues = gamePublisherFields.filter(
      (field) => field.value && field.value.trim() !== ''
    );

    for (const field of fieldsWithValues) {
      const { error } = await supabase.from('game_publisher_id_for_users').upsert(
        [
          {
            user_id: user.id,
            game_id: field.game_id,
            game_publisher_id: field.id,
            value: field.value.trim(),
            is_validated: field.isValidated || false,
            validation_date: field.validation_date || null,
            validation_data: field.validation_data || null,
            validation_source: field.validation_data ? 'riot_api' : null
          }
        ],
        { onConflict: 'user_id,game_publisher_id' }
      );

      if (error) throw error;
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      setIsSubmitting(true);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          fortnite_epic_id: fortniteData.value,
          is_fortnite_validated: fortniteData.isValidated,
          fortnite_validation_data: fortniteData.validationData
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await saveGamePublisherAccounts();

      if (steamData.value) {
        await saveSteamId64();
      }

      const checkSession = useAuthStore.getState().checkSession;
      await checkSession();

      toast.success(t('profile.settingsSavedSuccess', 'Settings saved successfully!'));
      navigate('/profile');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('profile.errorSavingSettings', 'Error saving settings'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const riotFields = gamePublisherFields.filter((f) => f.id_name.includes('riot'));
  const otherFields = gamePublisherFields.filter(
    (field) =>
      !field.id_name.includes('steam') &&
      !field.id_name.includes('riot') &&
      !field.id_name.includes('epic') &&
      !field.id_name.includes('fortnite')
  );

  const countValidated = (fields: GamePublisherField[]) =>
    fields.filter((f) => f.isValidated).length;

  return (
    <div
      className="min-h-screen pt-28 pb-16"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.primary}08 0%, transparent 30%)`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/profile"
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('profile.backToProfile')}
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${theme.colors.primary}15` }}
              >
                <Settings className="h-7 w-7" style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">
                  {t('profile.settingsTitle', 'Account Settings')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t(
                    'profile.settingsDescription',
                    'Manage your gaming account connections and integrations'
                  )}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SettingsCard
                title={t('discord.oauth.title', 'Discord')}
                icon={
                  <svg className="h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                }
                isExpanded={expandedCard === 'discord'}
                onToggle={() => toggleCard('discord')}
                accentColor="#5865F2"
                validatedCount={user?.discord_user_id ? 1 : 0}
                totalCount={1}
              >
                <DiscordOAuthIntegration disabled={isSubmitting} />
              </SettingsCard>

              <SettingsCard
                title={t('profile.steamAccount', 'Steam')}
                icon={
                  <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95c0-5.52-4.48-10-10-10z" />
                  </svg>
                }
                isExpanded={expandedCard === 'steam'}
                onToggle={() => toggleCard('steam')}
                accentColor="#1b2838"
                validatedCount={steamData.isValidated ? 1 : 0}
                totalCount={steamData.value ? 1 : 0}
              >
                <SteamAccountIntegration
                  initialValue={steamData.value}
                  initialValidated={steamData.isValidated}
                  initialValidationData={steamData.validationData}
                  onDataChange={setSteamData}
                  disabled={isSubmitting}
                />
              </SettingsCard>

              <SettingsCard
                title={t('profile.fortniteAccount', 'Fortnite')}
                icon={
                  <svg className="h-6 w-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                }
                isExpanded={expandedCard === 'fortnite'}
                onToggle={() => toggleCard('fortnite')}
                accentColor="#00d4ff"
                validatedCount={fortniteData.isValidated ? 1 : 0}
                totalCount={fortniteData.value ? 1 : 0}
              >
                <FortniteAccountIntegration
                  initialValue={fortniteData.value}
                  initialValidated={fortniteData.isValidated}
                  initialValidationData={fortniteData.validationData}
                  onDataChange={setFortniteData}
                  disabled={isSubmitting}
                />
              </SettingsCard>

              {isLoadingFields ? (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
                  <Loader className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                  <span className="text-gray-500">{t('profile.loadingRiotAccounts')}</span>
                </div>
              ) : riotFields.length > 0 ? (
                <SettingsCard
                  title={t('profile.riotGamesAccount', 'Riot Games')}
                  icon={
                    <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  }
                  isExpanded={expandedCard === 'riot'}
                  onToggle={() => toggleCard('riot')}
                  accentColor="#D13639"
                  validatedCount={countValidated(riotFields)}
                  totalCount={riotFields.filter((f) => f.value).length}
                >
                  <RiotAccountIntegration
                    initialRiotFields={riotFields}
                    onDataChange={(updatedFields) => {
                      setGamePublisherFields((prev) =>
                        prev.map((field) => {
                          const updated = updatedFields.find((f) => f.id === field.id);
                          return updated || field;
                        })
                      );
                    }}
                    disabled={isSubmitting}
                  />
                </SettingsCard>
              ) : null}
            </div>

            {otherFields.length > 0 && (
              <SettingsCard
                title={t('profile.otherGameAccounts', 'Other Games')}
                icon={<Gamepad2 className="h-6 w-6 text-green-500" />}
                isExpanded={expandedCard === 'other'}
                onToggle={() => toggleCard('other')}
                accentColor="#22c55e"
                validatedCount={countValidated(otherFields)}
                totalCount={otherFields.filter((f) => f.value).length}
              >
                <div className="space-y-4">
                  {otherFields.map((field) => (
                    <div key={field.id}>
                      <label
                        htmlFor={`other_${field.id}`}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {field.label}
                      </label>
                      <input
                        type="text"
                        id={`other_${field.id}`}
                        value={field.value || ''}
                        onChange={(e) => {
                          setGamePublisherFields((prev) =>
                            prev.map((f) =>
                              f.id === field.id
                                ? { ...f, value: e.target.value, isValidated: false }
                                : f
                            )
                          );
                        }}
                        className="w-full bg-white dark:bg-dark-300 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={`Your ${field.id_name}`}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('profile.game')}: {field.gameName}
                      </p>
                      {field.isValidated && (
                        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center text-green-500 text-sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span>{t('profile.accountValidated')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SettingsCard>
            )}

            <div
              className="p-4 rounded-xl border flex items-start gap-3"
              style={{
                backgroundColor: `${theme.colors.primary}08`,
                borderColor: `${theme.colors.primary}30`
              }}
            >
              <Link2 className="w-5 h-5 mt-0.5" style={{ color: theme.colors.primary }} />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">
                  {t('profile.tip', 'Tip')}:
                </strong>{' '}
                {t('profile.tipValidateAccountsToParticipate')}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                to="/profile"
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-white rounded-xl transition-colors font-medium"
              >
                {t('profile.cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 4px 15px ${theme.colors.primary}40`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    {t('profile.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t('profile.saveSettings', 'Save Settings')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
