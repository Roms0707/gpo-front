import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Send,
  User,
  Loader2,
  Sparkles,
  MessageCircle,
  ChevronRight,
  Play,
  Clock
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import CoachingMessageRenderer from './CoachingMessageRenderer';
import VideoSuggestionsInline from './VideoSuggestionsInline';
import VideoPreviewModal from './VideoPreviewModal';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface VideoRecommendation {
  content_id: string;
  title: string;
  reason: string;
  playlist_image_url?: string;
  duration?: number;
}

interface VideoSuggestion {
  id: string;
  title: string;
  description: string;
  content_url: string;
  playlist_image_url: string;
  duration: number | null;
  theme_label: string | null;
}

interface AICoachChatProps {
  gameId: string;
  gameName: string;
  theme: GameTheme;
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  videoRecommendations: VideoRecommendation[];
  onSendMessage: (message: string) => Promise<void>;
  onVideoClick: (contentId: string) => void;
}

const QuickActionPill: React.FC<{
  label: string;
  onClick: () => void;
  theme: GameTheme;
}> = ({ label, onClick, theme }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105"
    style={{
      backgroundColor: `${theme.colors.primary}15`,
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.primary}30`
    }}
  >
    {label}
  </button>
);

const TypingIndicator: React.FC<{ theme: GameTheme }> = ({ theme }) => (
  <div className="flex items-center gap-1.5 px-2">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full animate-bounce"
        style={{
          backgroundColor: theme.colors.primary,
          animationDelay: `${i * 150}ms`,
          animationDuration: '600ms'
        }}
      />
    ))}
  </div>
);

const AICoachChat: React.FC<AICoachChatProps> = ({
  gameId,
  gameName,
  theme,
  messages,
  isLoading,
  videoRecommendations,
  onSendMessage,
  onVideoClick
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [previewVideo, setPreviewVideo] = useState<VideoSuggestion | null>(null);
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    await onSendMessage(message);
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVideoSuggestionSelect = (video: VideoSuggestion) => {
    setPreviewVideo(video);
  };

  const handleVideoPreviewClose = () => {
    setPreviewVideo(null);
  };

  const handleOpenFullPage = (contentId: string) => {
    setWatchedVideoIds(prev => [...prev, contentId]);
    onVideoClick(contentId);
    setPreviewVideo(null);
  };

  const quickActions = [
    t('coaching.quickAction.analyzeGames'),
    t('coaching.quickAction.improveCS'),
    t('coaching.quickAction.reviewMatch'),
    t('coaching.quickAction.championTips'),
    t('coaching.quickAction.whatWrong')
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="flex flex-col h-full bg-dark-200/50 rounded-xl border border-gray-800 overflow-hidden">
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-800"
          style={{ backgroundColor: `${theme.colors.primary}10` }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              {t('coaching.aiCoach')}
              <Sparkles className="w-4 h-4" style={{ color: theme.colors.primary }} />
            </h3>
            <p className="text-xs text-gray-400">{gameName} {t('coaching.specialist')}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${theme.colors.primary}15` }}
              >
                <MessageCircle className="w-8 h-8" style={{ color: theme.colors.primary }} />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                {t('coaching.welcomeTitle')}
              </h4>
              <p className="text-gray-400 text-sm max-w-sm mb-6">
                {t('coaching.welcomeDesc', { gameName })}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickActions.slice(0, 3).map((action, index) => (
                  <QuickActionPill
                    key={index}
                    label={action}
                    onClick={() => handleQuickAction(action)}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`flex gap-2 max-w-[85%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                        msg.role === 'user' ? 'bg-gray-700' : ''
                      }`}
                      style={msg.role === 'assistant' ? { backgroundColor: `${theme.colors.primary}20` } : {}}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Brain className="w-4 h-4" style={{ color: theme.colors.primary }} />
                      )}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gray-700 text-white rounded-tr-sm'
                          : 'bg-dark-300 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <CoachingMessageRenderer
                          content={msg.content}
                          theme={theme}
                          animate={index === messages.length - 1}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {videoRecommendations.length > 0 && (
                <div className="mt-4 p-3 bg-dark-300/50 rounded-xl border border-gray-700 animate-slide-up">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Play className="w-3 h-3" />
                    {t('coaching.recommendedVideos')}
                  </p>
                  <div className="space-y-2">
                    {videoRecommendations.map((video) => (
                      <button
                        key={video.content_id}
                        onClick={() => onVideoClick(video.content_id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-dark-200/50 hover:bg-dark-200 transition-colors group text-left"
                      >
                        <div className="w-16 h-10 rounded bg-gray-700 flex-shrink-0 overflow-hidden">
                          {video.playlist_image_url ? (
                            <img
                              src={video.playlist_image_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate group-hover:text-primary-400 transition-colors">
                            {video.title}
                          </p>
                          {video.duration && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(video.duration)}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex gap-2 max-w-[85%]">
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${theme.colors.primary}20` }}
                    >
                      <Brain className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-dark-300 rounded-tl-sm">
                      <div className="flex items-center gap-2">
                        <TypingIndicator theme={theme} />
                        <span className="text-sm text-gray-400">{t('coaching.thinking')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {messages.length > 0 && !isLoading && (
          <div className="px-4 py-2 border-t border-gray-800/50">
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((action, index) => (
                <QuickActionPill
                  key={index}
                  label={action}
                  onClick={() => handleQuickAction(action)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-800">
          <VideoSuggestionsInline
            inputValue={inputValue}
            gameId={gameId}
            theme={theme}
            onVideoSelect={handleVideoSuggestionSelect}
            excludeIds={watchedVideoIds}
          />

          <form onSubmit={handleSubmit} className="p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('coaching.askPlaceholder')}
                disabled={isLoading}
                rows={1}
                className="flex-1 px-4 py-2.5 bg-dark-300 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none text-sm"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.text
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <VideoPreviewModal
        video={previewVideo ? {
          content_id: previewVideo.id,
          title: previewVideo.title,
          description: previewVideo.description,
          content_url: previewVideo.content_url,
          playlist_image_url: previewVideo.playlist_image_url,
          duration: previewVideo.duration || undefined
        } : null}
        isOpen={!!previewVideo}
        onClose={handleVideoPreviewClose}
        onOpenFullPage={handleOpenFullPage}
        theme={theme}
      />
    </>
  );
};

export default AICoachChat;
