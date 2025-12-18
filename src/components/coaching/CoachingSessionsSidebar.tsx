import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Plus,
  Clock,
  ChevronRight
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';

interface CoachingSession {
  id: string;
  session_title: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed';
}

interface CoachingSessionsSidebarProps {
  sessions: CoachingSession[];
  currentSessionId: string | null;
  theme: GameTheme;
  onSessionClick: (sessionId: string) => void;
  onNewSession: () => void;
}

const CoachingSessionsSidebar: React.FC<CoachingSessionsSidebarProps> = ({
  sessions,
  currentSessionId,
  theme,
  onSessionClick,
  onNewSession
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('common.now');
    } else if (diffDays === 1) {
      return t('coaching.yesterday');
    } else if (diffDays < 7) {
      return t('common.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-dark-200/50 rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b border-gray-800">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.text
          }}
        >
          <Plus className="w-4 h-4" />
          {t('coaching.newSession')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('coaching.noSessions')}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => onSessionClick(session.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-dark-300'
                      : 'hover:bg-dark-300/50'
                  }`}
                  style={isActive ? { borderLeft: `3px solid ${theme.colors.primary}` } : {}}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: isActive ? theme.colors.primary : '#6b7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {session.session_title || t('coaching.untitledSession')}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(session.updated_at)}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                      }`}
                      style={{ color: theme.colors.primary }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachingSessionsSidebar;
