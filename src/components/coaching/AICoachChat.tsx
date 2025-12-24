import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Clock,
  Maximize2,
  Minimize2,
  X,
  ArrowDown
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
  size?: 'sm' | 'md';
}> = ({ label, onClick, theme, size = 'sm' }) => (
  <button
    onClick={onClick}
    className={`rounded-full font-medium transition-all hover:scale-105 ${
      size === 'md' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm'
    }`}
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToLatestMessage = useCallback(() => {
    setTimeout(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 0);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > prevMessageCount && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        scrollToLatestMessage();
      } else if (lastMessage.role === 'assistant') {
        setTimeout(() => {
          scrollToLatestMessage();
        }, 150);
      }
    }
    setPrevMessageCount(messages.length);
  }, [messages, prevMessageCount, scrollToLatestMessage]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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

  const chatContent = (
    <div
      className={`flex flex-col bg-dark-200/95 overflow-hidden ${
        isFullscreen
          ? 'h-full rounded-none border-0'
          : 'h-full rounded-xl border border-gray-800'
      }`}
      style={!isFullscreen ? { backgroundColor: 'rgba(30, 30, 30, 0.5)' } : {}}
    >
      <div
        className={`flex items-center gap-3 border-b border-gray-800 ${
          isFullscreen ? 'px-6 py-4' : 'px-4 py-3'
        }`}
        style={{ backgroundColor: `${theme.colors.primary}10` }}
      >
        <div
          className={`rounded-full flex items-center justify-center ${
            isFullscreen ? 'w-12 h-12' : 'w-10 h-10'
          }`}
          style={{ backgroundColor: `${theme.colors.primary}20` }}
        >
          <Brain
            className={isFullscreen ? 'w-6 h-6' : 'w-5 h-5'}
            style={{ color: theme.colors.primary }}
          />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-white flex items-center gap-2 ${
            isFullscreen ? 'text-xl' : 'text-base'
          }`}>
            {t('coaching.aiCoach')}
            <Sparkles
              className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}
              style={{ color: theme.colors.primary }}
            />
          </h3>
          <p className={`text-gray-400 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
            {gameName} {t('coaching.specialist')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto space-y-4 min-h-0 relative ${
          isFullscreen ? 'p-6 max-w-4xl mx-auto w-full' : 'p-4'
        }`}
      >
        {messages.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full text-center ${
            isFullscreen ? 'py-16' : 'py-8'
          }`}>
            <div
              className={`rounded-full flex items-center justify-center mb-6 ${
                isFullscreen ? 'w-24 h-24' : 'w-16 h-16'
              }`}
              style={{ backgroundColor: `${theme.colors.primary}15` }}
            >
              <MessageCircle
                className={isFullscreen ? 'w-12 h-12' : 'w-8 h-8'}
                style={{ color: theme.colors.primary }}
              />
            </div>
            <h4 className={`font-bold text-white mb-3 ${
              isFullscreen ? 'text-2xl' : 'text-lg'
            }`}>
              {t('coaching.welcomeTitle')}
            </h4>
            <p className={`text-gray-400 max-w-md mb-8 ${
              isFullscreen ? 'text-base' : 'text-sm'
            }`}>
              {t('coaching.welcomeDesc', { gameName })}
            </p>
            <div className={`flex flex-wrap justify-center ${
              isFullscreen ? 'gap-3' : 'gap-2'
            }`}>
              {quickActions.slice(0, isFullscreen ? 5 : 3).map((action, index) => (
                <QuickActionPill
                  key={index}
                  label={action}
                  onClick={() => handleQuickAction(action)}
                  theme={theme}
                  size={isFullscreen ? 'md' : 'sm'}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              return (
              <div
                key={index}
                ref={isLastMessage ? lastMessageRef : undefined}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`flex gap-3 ${
                    isFullscreen ? 'max-w-[75%]' : 'max-w-[85%]'
                  } ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-gray-700' : ''
                    } ${isFullscreen ? 'w-10 h-10' : 'w-8 h-8'}`}
                    style={msg.role === 'assistant' ? { backgroundColor: `${theme.colors.primary}20` } : {}}
                  >
                    {msg.role === 'user' ? (
                      <User className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} />
                    ) : (
                      <Brain
                        className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}
                        style={{ color: theme.colors.primary }}
                      />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gray-700 text-white rounded-tr-sm'
                        : 'bg-dark-300 text-gray-200 rounded-tl-sm'
                    } ${isFullscreen ? 'px-5 py-4' : 'px-4 py-3'}`}
                  >
                    {msg.role === 'assistant' ? (
                      <CoachingMessageRenderer
                        content={msg.content}
                        theme={theme}
                        animate={index === messages.length - 1}
                      />
                    ) : (
                      <p className={`whitespace-pre-wrap ${
                        isFullscreen ? 'text-base' : 'text-sm'
                      }`}>{msg.content}</p>
                    )}
                    <p className={`text-gray-500 mt-2 ${
                      isFullscreen ? 'text-sm' : 'text-xs'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
            })}

            {videoRecommendations.length > 0 && (
              <div className={`mt-4 bg-dark-300/50 rounded-xl border border-gray-700 animate-slide-up ${
                isFullscreen ? 'p-4' : 'p-3'
              }`}>
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
                <div className={`flex gap-3 ${isFullscreen ? 'max-w-[75%]' : 'max-w-[85%]'}`}>
                  <div
                    className={`rounded-full flex-shrink-0 flex items-center justify-center ${
                      isFullscreen ? 'w-10 h-10' : 'w-8 h-8'
                    }`}
                    style={{ backgroundColor: `${theme.colors.primary}20` }}
                  >
                    <Brain
                      className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}
                      style={{ color: theme.colors.primary }}
                    />
                  </div>
                  <div className={`rounded-2xl bg-dark-300 rounded-tl-sm ${
                    isFullscreen ? 'px-5 py-4' : 'px-4 py-3'
                  }`}>
                    <div className="flex items-center gap-2">
                      <TypingIndicator theme={theme} />
                      <span className={`text-gray-400 ${
                        isFullscreen ? 'text-base' : 'text-sm'
                      }`}>{t('coaching.thinking')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}

        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.text,
            }}
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {messages.length > 0 && !isLoading && (
        <div className={`border-t border-gray-800/50 ${
          isFullscreen ? 'px-6 py-3' : 'px-4 py-2'
        }`}>
          <div className={`flex flex-wrap ${isFullscreen ? 'gap-2 max-w-4xl mx-auto' : 'gap-1.5'}`}>
            {quickActions.map((action, index) => (
              <QuickActionPill
                key={index}
                label={action}
                onClick={() => handleQuickAction(action)}
                theme={theme}
                size={isFullscreen ? 'md' : 'sm'}
              />
            ))}
          </div>
        </div>
      )}

      <div className={`border-t border-gray-800 ${
        isFullscreen ? 'bg-dark-300/50' : ''
      }`}>
        <div className={isFullscreen ? 'max-w-4xl mx-auto' : ''}>
          <VideoSuggestionsInline
            inputValue={inputValue}
            gameId={gameId}
            theme={theme}
            onVideoSelect={handleVideoSuggestionSelect}
            excludeIds={watchedVideoIds}
          />

          <form onSubmit={handleSubmit} className={isFullscreen ? 'p-4' : 'p-3'}>
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('coaching.askPlaceholder')}
                disabled={isLoading}
                rows={1}
                className={`flex-1 bg-dark-300 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none ${
                  isFullscreen ? 'px-5 py-3 text-base' : 'px-4 py-2.5 text-sm'
                }`}
                style={{ minHeight: isFullscreen ? '52px' : '42px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 ${
                  isFullscreen ? 'px-5 py-3' : 'px-4 py-2.5'
                }`}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.text
                }}
              >
                {isLoading ? (
                  <Loader2 className={`animate-spin ${isFullscreen ? 'w-6 h-6' : 'w-5 h-5'}`} />
                ) : (
                  <Send className={isFullscreen ? 'w-6 h-6' : 'w-5 h-5'} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}08 0%, transparent 50%), linear-gradient(to bottom, #0f0f0f, #1a1a1a)`
            }}
          />
          <div className="relative h-full">
            {chatContent}
          </div>
        </div>
      ) : (
        chatContent
      )}

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
