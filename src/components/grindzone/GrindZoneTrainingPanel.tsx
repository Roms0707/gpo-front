import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Trophy,
  BarChart3,
  X,
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { GalaxyRubric } from '../../types/galaxy';
import GrindZoneCoachSidebar from './GrindZoneCoachSidebar';
import GrindZoneMyTraining from './GrindZoneMyTraining';
import GrindZoneActiveQuests from './GrindZoneActiveQuests';
import GrindZoneWarmupZone from './GrindZoneWarmupZone';

type PanelTab = 'coach' | 'training' | 'warmup';

interface GrindZoneTrainingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameName: string;
  theme: GameTheme;
  rubrics: GalaxyRubric[];
  quizStatusMap: Map<string, { status: string; submission?: { score?: number; total_questions?: number; is_completed?: boolean } }>;
  contextPlaylistName?: string | null;
  onSelectRubric: (rubric: GalaxyRubric) => void;
}

const GrindZoneTrainingPanel: React.FC<GrindZoneTrainingPanelProps> = ({
  isOpen,
  onClose,
  gameId,
  gameName,
  theme,
  rubrics,
  quizStatusMap,
  contextPlaylistName,
  onSelectRubric,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PanelTab>('coach');
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const handleOpenCoachWithPrompt = useCallback((prompt?: string) => {
    if (prompt) setPendingPrompt(prompt);
    setActiveTab('coach');
  }, []);

  const handlePromptConsumed = useCallback(() => {
    setPendingPrompt(null);
  }, []);

  if (!isOpen) return null;

  const tabs: { key: PanelTab; icon: React.ElementType; label: string }[] = [
    { key: 'coach', icon: Brain, label: t('coaching.aiCoach') },
    { key: 'training', icon: BarChart3, label: t('grindZone.myTraining') },
    { key: 'warmup', icon: Trophy, label: t('grindZone.warmUp') },
  ];

  const handleSelectRubric = (rubric: GalaxyRubric) => {
    onSelectRubric(rubric);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:w-[75vw] sm:max-w-[1400px] bg-white dark:bg-dark-100 shadow-2xl animate-slide-in-right flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <span className="font-bold text-gray-900 dark:text-white">
              {tabs.find(t => t.key === activeTab)?.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors relative ${
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={isActive ? { color: theme.colors.primary } : undefined} />
                <span>{tab.label}</span>
                {isActive && (
                  <div
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'coach' && (
            <GrindZoneCoachSidebar
              gameId={gameId}
              gameName={gameName}
              theme={theme}
              contextPlaylistName={contextPlaylistName}
              pendingPrompt={pendingPrompt}
              onPromptConsumed={handlePromptConsumed}
              onClose={onClose}
              className="h-full border-0 rounded-none"
            />
          )}

          {activeTab === 'training' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <GrindZoneMyTraining
                theme={theme}
                gameId={gameId}
                rubrics={rubrics}
                quizStatusMap={quizStatusMap}
                onSelectRubric={handleSelectRubric}
              />
              <GrindZoneActiveQuests
                gameId={gameId}
                gameName={gameName}
                theme={theme}
                onOpenCoach={handleOpenCoachWithPrompt}
              />
            </div>
          )}

          {activeTab === 'warmup' && (
            <div className="h-full overflow-y-auto p-4">
              <GrindZoneWarmupZone
                gameId={gameId}
                gameName={gameName}
                theme={theme}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrindZoneTrainingPanel;
