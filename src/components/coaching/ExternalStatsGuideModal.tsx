import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, ExternalLink, Copy, Check, Search, User, Link2 } from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { useState } from 'react';

interface ExternalStatsGuideModalProps {
  gameName: string;
  theme: GameTheme;
  onClose: () => void;
}

interface PlatformGuide {
  id: string;
  name: string;
  url: string;
  games: string[];
  steps: string[];
  exampleUrl: string;
}

const PLATFORM_GUIDES: PlatformGuide[] = [
  {
    id: 'op.gg',
    name: 'OP.GG',
    url: 'https://op.gg',
    games: ['league of legends', 'lol', 'valorant', 'tft', 'teamfight tactics'],
    steps: [
      'Go to op.gg and select your game',
      'Search for your username in the search bar',
      'Once on your profile page, copy the URL from your browser',
    ],
    exampleUrl: 'https://op.gg/summoners/euw/YourName-TAG'
  },
  {
    id: 'tracker.gg',
    name: 'Tracker.gg',
    url: 'https://tracker.gg',
    games: ['valorant', 'fortnite', 'apex legends', 'apex', 'rocket league', 'cs2', 'counter-strike', 'overwatch', 'fc 24', 'fc 25', 'fc24', 'fc25', 'fc 26', 'fc26', 'ea fc', 'fifa', 'the finals', 'splitgate', 'halo infinite', 'halo', 'pubg', 'fall guys'],
    steps: [
      'Go to tracker.gg and select your game',
      'Click "Search Profile" and enter your username',
      'For Riot games, use format: Name#TAG',
      'Once on your profile page, copy the full URL',
    ],
    exampleUrl: 'https://tracker.gg/fc/profile/origin/YourName/overview'
  },
  {
    id: 'blitz.gg',
    name: 'Blitz.gg',
    url: 'https://blitz.gg',
    games: ['league of legends', 'lol', 'valorant', 'tft', 'teamfight tactics'],
    steps: [
      'Go to blitz.gg',
      'Use the search bar to find your profile',
      'Select your region and enter your username',
      'Copy the profile URL from your browser',
    ],
    exampleUrl: 'https://blitz.gg/lol/profile/euw1/YourName-TAG'
  },
  {
    id: 'u.gg',
    name: 'U.GG',
    url: 'https://u.gg',
    games: ['league of legends', 'lol'],
    steps: [
      'Go to u.gg',
      'Click the search icon in the top right',
      'Enter your Riot ID (Name#TAG)',
      'Select your region and view your profile',
      'Copy the URL from your browser',
    ],
    exampleUrl: 'https://u.gg/lol/profile/euw1/yourname-tag/overview'
  },
  {
    id: 'leetify',
    name: 'Leetify',
    url: 'https://leetify.com',
    games: ['cs2', 'counter-strike', 'csgo'],
    steps: [
      'Go to leetify.com and sign in with Steam',
      'Your profile will be created automatically',
      'Click on your profile name in the top right',
      'Copy the profile URL from your browser',
    ],
    exampleUrl: 'https://leetify.com/app/profile/76561198xxxxxxxxx'
  },
  {
    id: 'wotlabs',
    name: 'WoTLabs',
    url: 'https://wotlabs.net',
    games: ['world of tanks', 'wot'],
    steps: [
      'Go to wotlabs.net',
      'Select your server region',
      'Search for your player name',
      'Copy the profile URL from your browser',
    ],
    exampleUrl: 'https://wotlabs.net/eu/player/YourName'
  },
  {
    id: 'dotabuff',
    name: 'Dotabuff',
    url: 'https://www.dotabuff.com',
    games: ['dota 2', 'dota'],
    steps: [
      'Go to dotabuff.com',
      'Search for your Steam name or ID',
      'Once on your profile page, copy the URL',
    ],
    exampleUrl: 'https://www.dotabuff.com/players/123456789'
  },
  {
    id: 'stratz',
    name: 'STRATZ',
    url: 'https://stratz.com',
    games: ['dota 2', 'dota'],
    steps: [
      'Go to stratz.com',
      'Click "Search" and enter your Steam ID',
      'View your profile and copy the URL',
    ],
    exampleUrl: 'https://stratz.com/players/123456789'
  },
];

const normalizeGameName = (name: string): string[] => {
  const lower = name.toLowerCase();
  const terms = [lower];

  if (lower.includes('fc') || lower.includes('fifa') || lower.includes('ea sports')) {
    terms.push('fc 24', 'fc 25', 'fc24', 'fc25', 'fc 26', 'fc26', 'ea fc', 'fifa');
  }
  if (lower.includes('league') || lower.includes('lol')) {
    terms.push('league of legends', 'lol');
  }
  if (lower.includes('counter') || lower.includes('cs2') || lower.includes('csgo')) {
    terms.push('cs2', 'counter-strike', 'csgo');
  }
  if (lower.includes('dota')) {
    terms.push('dota 2', 'dota');
  }
  if (lower.includes('apex')) {
    terms.push('apex legends', 'apex');
  }
  if (lower.includes('tft') || lower.includes('teamfight')) {
    terms.push('tft', 'teamfight tactics');
  }

  return terms;
};

const ExternalStatsGuideModal: React.FC<ExternalStatsGuideModalProps> = ({
  gameName,
  theme,
  onClose
}) => {
  const { t } = useTranslation();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const gameTerms = normalizeGameName(gameName);

  const relevantPlatforms = PLATFORM_GUIDES.filter(
    p => p.games.some(g => gameTerms.some(term => term.includes(g) || g.includes(term)))
  );

  const platformsToShow = relevantPlatforms.length > 0 ? relevantPlatforms : PLATFORM_GUIDES;

  const handleCopyExample = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-dark-200 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              <Link2 className="w-5 h-5" style={{ color: theme.colors.primary }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('coaching.howToFindProfile')}</h2>
              <p className="text-sm text-gray-400">{t('coaching.howToFindProfileDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div className="space-y-6">
            <div className="bg-dark-300/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <Search className="w-4 h-4" style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{t('coaching.quickTip')}</h3>
                  <p className="text-sm text-gray-400">
                    {t('coaching.quickTipDesc')}
                  </p>
                </div>
              </div>
            </div>

            {platformsToShow.map((platform) => (
              <div
                key={platform.id}
                className="bg-dark-300/30 border border-gray-800 rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-dark-400 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{platform.name}</h3>
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center gap-1 hover:underline"
                        style={{ color: theme.colors.primary }}
                      >
                        {platform.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.text
                    }}
                  >
                    {t('coaching.visitSite')}
                  </a>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">{t('coaching.steps')}</h4>
                    <ol className="space-y-2">
                      {platform.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: `${theme.colors.primary}20`,
                              color: theme.colors.primary
                            }}
                          >
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-300 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">{t('coaching.exampleUrl')}</h4>
                    <div className="flex items-center gap-2 bg-dark-400 rounded-lg p-3">
                      <code className="flex-1 text-sm text-gray-400 truncate">
                        {platform.exampleUrl}
                      </code>
                      <button
                        onClick={() => handleCopyExample(platform.exampleUrl)}
                        className="p-1.5 rounded hover:bg-dark-300 transition-colors flex-shrink-0"
                        title={t('common.copy')}
                      >
                        {copiedUrl === platform.exampleUrl ? (
                          <Check className="w-4 h-4 text-success-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-dark-300/30">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg font-semibold transition-colors hover:bg-dark-300 text-white border border-gray-700"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ExternalStatsGuideModal;
