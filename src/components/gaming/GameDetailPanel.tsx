import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader,
  AlertTriangle,
  Sword,
  Crosshair,
  Target,
  Gamepad2,
} from 'lucide-react';
import { getGameTheme } from '../../utils/gameThemes';
import { useRiotStats, useValorantStats, useFortniteStatsData, useSteamStats } from '../../hooks/useGameStats';
import GameTabHeader from './GameTabHeader';
import RiotAccountCard from './RiotAccountCard';
import RiotMatchHistoryCard from './RiotMatchHistoryCard';
import RiotPerformanceTips from './RiotPerformanceTips';
import ValorantAccountCard from './ValorantAccountCard';
import ValorantMatchHistoryCard from './ValorantMatchHistoryCard';
import ValorantPerformanceTips from './ValorantPerformanceTips';
import FortniteAccountCard from './FortniteAccountCard';
import FortniteMatchHistoryCard from './FortniteMatchHistoryCard';
import FortnitePerformanceTips from './FortnitePerformanceTips';
import SteamProfileCard from './SteamProfileCard';
import SteamBansCard from './SteamBansCard';
import SteamGamesCard from './SteamGamesCard';
import SteamLevelCard from './SteamLevelCard';
import GameRankingCard from './GameRankingCard';
import toast from 'react-hot-toast';

interface GameDetailPanelProps {
  gameName: string;
  gameId: string;
  userProfile: any;
  user: any;
  displayingOwnStats: boolean;
  onBack: () => void;
}

const GameDetailPanel: React.FC<GameDetailPanelProps> = ({
  gameName,
  gameId,
  userProfile,
  user,
  displayingOwnStats,
  onBack,
}) => {
  const { t } = useTranslation();
  const gameTheme = getGameTheme(gameName);
  const normalizedName = gameName.toLowerCase();

  const isLoL = normalizedName.includes('league of legends') || normalizedName === 'lol';
  const isValorant = normalizedName.includes('valorant');
  const isFortnite = normalizedName.includes('fortnite');

  const lolAccount = userProfile?.gaming_accounts?.find(
    (a: any) =>
      a.game_publisher_ids?.games?.name === 'League of Legends' &&
      a.is_validated &&
      a.validation_data?.puuid
  );

  const valorantAccount = userProfile?.gaming_accounts?.find(
    (a: any) =>
      a.game_publisher_ids?.games?.name === 'Valorant' &&
      a.is_validated &&
      a.validation_data?.puuid
  );

  const fortniteAccount = userProfile?.gaming_accounts?.find(
    (a: any) =>
      a.game_publisher_ids?.games?.name === 'Fortnite' ||
      a.game_publisher_ids?.games?.name?.toLowerCase().includes('fortnite')
  );

  const steamAccount = userProfile?.gaming_accounts?.find(
    (a: any) =>
      (a.game_publisher_ids?.games?.id === gameId &&
        (a.game_publisher_ids?.id_name === 'steamid64' ||
         a.game_publisher_ids?.label?.toLowerCase().includes('steam'))) ||
      a.game_publisher_ids?.games?.name?.toLowerCase().includes('steam')
  );

  const isSteamLinked = Boolean(steamAccount) || normalizedName.includes('steam');

  const riot = useRiotStats();
  const valorant = useValorantStats();
  const fortnite = useFortniteStatsData();
  const steam = useSteamStats();

  const hasFortniteEpicId = Boolean(user?.fortnite_epic_id);

  useEffect(() => {
    if (isLoL && lolAccount && riot.matchHistory.length === 0 && !riot.isLoading) {
      riot.loadMatchHistory(lolAccount.validation_data.puuid, lolAccount.validation_data.region || 'euw1');
    }
  }, [isLoL, lolAccount]);

  useEffect(() => {
    if (isValorant && valorantAccount && !valorant.rankedData && !valorant.isLoading) {
      valorant.loadData(valorantAccount.validation_data.puuid, valorantAccount.validation_data.region);
    }
  }, [isValorant, valorantAccount]);

  useEffect(() => {
    if (isSteamLinked && steamAccount && !steam.data && !steam.isLoading) {
      steam.loadData(steamAccount.value);
    }
  }, [isSteamLinked, steamAccount]);

  const gameRankings = (userProfile?.game_rankings || []).filter(
    (r: any) => {
      const rName = r.game_name || r.games?.name || '';
      return rName.toLowerCase().includes(normalizedName) || normalizedName.includes(rName.toLowerCase());
    }
  );

  const getIcon = () => {
    if (isLoL) return Sword;
    if (isValorant) return Crosshair;
    if (isFortnite) return Target;
    return Gamepad2;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <motion.button
        whileHover={{ x: -4 }}
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('gaming.backToDashboard')}
      </motion.button>

      <GameTabHeader
        title={t('gaming.gameStatsFor', { game: gameName })}
        theme={gameTheme}
        icon={getIcon()}
        isValidated={
          isLoL ? lolAccount?.is_validated :
          isValorant ? valorantAccount?.is_validated :
          isSteamLinked ? steamAccount?.is_validated :
          undefined
        }
        onRefresh={
          displayingOwnStats
            ? isLoL && lolAccount
              ? () => riot.loadMatchHistory(lolAccount.validation_data.puuid, lolAccount.validation_data.region || 'euw1')
              : isValorant && valorantAccount
              ? () => valorant.loadData(valorantAccount.validation_data.puuid, valorantAccount.validation_data.region)
              : isSteamLinked && steamAccount
              ? () => steam.loadData(steamAccount.value)
              : undefined
            : undefined
        }
        isRefreshing={riot.isLoading || valorant.isLoading || steam.isLoading || fortnite.isLoading}
      />

      {isLoL && (
        <LoLDetail
          account={lolAccount}
          riot={riot}
          displayingOwnStats={displayingOwnStats}
          gameTheme={gameTheme}
        />
      )}

      {isValorant && (
        <ValorantDetail
          account={valorantAccount}
          valorant={valorant}
          displayingOwnStats={displayingOwnStats}
          gameTheme={gameTheme}
        />
      )}

      {isFortnite && (
        <FortniteDetail
          account={fortniteAccount}
          fortnite={fortnite}
          user={user}
          hasFortniteEpicId={hasFortniteEpicId}
          displayingOwnStats={displayingOwnStats}
        />
      )}

      {isSteamLinked && (
        <SteamDetail
          account={steamAccount}
          steam={steam}
          gameTheme={gameTheme}
          displayingOwnStats={displayingOwnStats}
        />
      )}

      {!isLoL && !isValorant && !isFortnite && !isSteamLinked && gameRankings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {gameRankings.map((ranking: any, idx: number) => (
            <GameRankingCard
              key={idx}
              ranking={{
                ...ranking,
                game_name: ranking.game_name || ranking.games?.name || gameName,
              }}
            />
          ))}
        </div>
      )}

      {!isLoL && !isValorant && !isFortnite && !isSteamLinked && gameRankings.length === 0 && (
        <div className="text-center py-12">
          <Gamepad2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('gaming.noRankData')}</p>
        </div>
      )}
    </motion.div>
  );
};

const LoLDetail: React.FC<{
  account: any;
  riot: ReturnType<typeof useRiotStats>;
  displayingOwnStats: boolean;
  gameTheme: any;
}> = ({ account, riot, displayingOwnStats, gameTheme }) => {
  const { t } = useTranslation();

  if (!account) {
    return (
      <div className="text-center py-8">
        <Sword className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">{t('gaming.noValidatedLoLAccountFound')}</p>
        {displayingOwnStats && (
          <Link
            to="/profile/settings#gaming-accounts"
            className="mt-4 inline-block px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: gameTheme.colors.primary, color: gameTheme.colors.text }}
          >
            {t('gaming.linkYourLoLAccount')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RiotAccountCard
        account={account}
        onLoadMatchHistory={displayingOwnStats ? () => riot.loadMatchHistory(account.validation_data.puuid, account.validation_data.region || 'euw1') : undefined}
        isLoadingMatches={riot.isLoading}
      />
      {riot.matchHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RiotMatchHistoryCard
            matches={riot.matchHistory}
            isLoading={riot.isLoading}
            onLoadMore={displayingOwnStats ? () => toast.info(t('gaming.featureComingSoon')) : undefined}
            hasMore={false}
          />
          <RiotPerformanceTips
            matches={riot.matchHistory}
            rankedStats={account?.validation_data?.rankedStats}
          />
        </div>
      )}
      {riot.error && (
        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
          <span>{riot.error}</span>
        </div>
      )}
    </div>
  );
};

const ValorantDetail: React.FC<{
  account: any;
  valorant: ReturnType<typeof useValorantStats>;
  displayingOwnStats: boolean;
  gameTheme: any;
}> = ({ account, valorant, displayingOwnStats, gameTheme }) => {
  const { t } = useTranslation();

  if (!account) {
    return (
      <div className="text-center py-8">
        <Crosshair className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">{t('gaming.noValidatedValorantAccountFound')}</p>
        {displayingOwnStats && (
          <Link
            to="/profile/settings#gaming-accounts"
            className="mt-4 inline-block px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: gameTheme.colors.primary, color: gameTheme.colors.text }}
          >
            {t('gaming.linkYourValorantAccount')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ValorantAccountCard
        account={account}
        onLoadMatchHistory={
          displayingOwnStats
            ? (puuid: string, region: string) => valorant.loadData(puuid, region)
            : undefined
        }
        isLoadingMatches={valorant.isLoading}
      />
      {valorant.matchHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ValorantMatchHistoryCard
            matches={valorant.matchHistory}
            isLoading={valorant.isLoading}
            onLoadMore={displayingOwnStats ? () => toast.info(t('gaming.featureComingSoon')) : undefined}
            hasMore={false}
          />
          <ValorantPerformanceTips
            matches={valorant.matchHistory}
            rankedData={valorant.rankedData}
          />
        </div>
      )}
      {valorant.error && (
        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
          <span>{valorant.error}</span>
        </div>
      )}
    </div>
  );
};

const FortniteDetail: React.FC<{
  account: any;
  fortnite: ReturnType<typeof useFortniteStatsData>;
  user: any;
  hasFortniteEpicId: boolean;
  displayingOwnStats: boolean;
}> = ({ account, fortnite, user, hasFortniteEpicId, displayingOwnStats }) => {
  const { t } = useTranslation();

  if (!account && !hasFortniteEpicId) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">{t('gaming.noFortniteStatsForPlayer')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FortniteAccountCard
        account={{
          username: hasFortniteEpicId ? user?.fortnite_epic_id || '' : account?.username || '',
          platform: 'epic',
          isValidated: hasFortniteEpicId ? user?.is_fortnite_validated || false : account?.isValidated || false,
          validationData: hasFortniteEpicId ? user?.fortnite_validation_data : account?.validationData,
        }}
        onLoadStats={displayingOwnStats ? fortnite.loadStats : async () => {}}
        isLoadingStats={fortnite.isLoading}
        statsData={fortnite.stats}
      />
      {fortnite.stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FortniteMatchHistoryCard
            matchHistory={fortnite.stats?.matches || []}
            isLoading={fortnite.isLoading}
          />
          <FortnitePerformanceTips stats={fortnite.stats?.stats?.all?.overall} />
        </div>
      )}
      {fortnite.error && (
        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
          <span>{fortnite.error}</span>
        </div>
      )}
    </div>
  );
};

const SteamDetail: React.FC<{
  account: any;
  steam: ReturnType<typeof useSteamStats>;
  gameTheme: any;
  displayingOwnStats: boolean;
}> = ({ account, steam, gameTheme, displayingOwnStats }) => {
  const { t } = useTranslation();

  if (!account) {
    return (
      <div className="text-center py-8">
        <Gamepad2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">{t('gaming.noSteamAccountConfigured')}</p>
        {displayingOwnStats && (
          <Link
            to="/profile/settings#gaming-accounts"
            className="mt-4 inline-block px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: gameTheme.colors.primary, color: gameTheme.colors.text }}
          >
            {t('gaming.linkYourSteamAccount')}
          </Link>
        )}
      </div>
    );
  }

  if (steam.isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 animate-spin mr-3" style={{ color: gameTheme.colors.primary }} />
        <span className="text-gray-400">{t('gaming.loadingSteamData')}</span>
      </div>
    );
  }

  if (steam.error) {
    return (
      <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded-lg flex items-center">
        <AlertTriangle className="h-5 w-5 text-error-400 mr-2" />
        <span>{steam.error}</span>
      </div>
    );
  }

  if (!steam.data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">{t('gaming.noSteamDataAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steam.data.profile && <SteamProfileCard profile={steam.data.profile} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {steam.data.level !== undefined && steam.data.profile && (
          <SteamLevelCard level={steam.data.level} profile={steam.data.profile} />
        )}
        {steam.data.bans && <SteamBansCard bans={steam.data.bans} />}
      </div>
      {steam.data.games && <SteamGamesCard games={steam.data.games} />}
    </div>
  );
};

export default GameDetailPanel;
