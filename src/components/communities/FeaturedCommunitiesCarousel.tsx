import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Flame, Users, MessageSquare, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface FeaturedCommunity {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  online_count: number;
  last_activity?: string;
  banner_gradient?: string;
  is_trending?: boolean;
}

interface FeaturedCommunitiesCarouselProps {
  communities: FeaturedCommunity[];
  onJoin: (communityId: string) => void;
  onOpen: (communityId: string, name: string, description?: string) => void;
  isUserMember: (communityId: string) => boolean;
  isJoining: boolean;
}

export const FeaturedCommunitiesCarousel: React.FC<FeaturedCommunitiesCarouselProps> = ({
  communities,
  onJoin,
  onOpen,
  isUserMember,
  isJoining,
}) => {
  const { t } = useTranslation();
  const { primaryColor, secondaryColor } = useAppConfig();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const gradients = [
    `linear-gradient(135deg, ${primaryColor}40 0%, #0F0F14 100%)`,
    `linear-gradient(135deg, ${secondaryColor}40 0%, #0F0F14 100%)`,
    `linear-gradient(135deg, #8B5CF640 0%, #0F0F14 100%)`,
    `linear-gradient(135deg, #22C55E40 0%, #0F0F14 100%)`,
    `linear-gradient(135deg, #EF444440 0%, #0F0F14 100%)`,
  ];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % communities.length);
  }, [communities.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + communities.length) % communities.length);
  }, [communities.length]);

  useEffect(() => {
    if (!isAutoPlaying || communities.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, communities.length]);

  if (communities.length === 0) return null;

  const getVisibleIndices = () => {
    const indices: number[] = [];
    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + communities.length) % communities.length;
      indices.push(index);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();

  return (
    <div
      className="relative mb-8 sm:mb-10"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {t('communitiesPage.featured.title')}
          </h2>
        </div>

        {communities.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div className="hidden md:flex items-stretch gap-4 justify-center">
          {visibleIndices.map((index, position) => {
            const community = communities[index];
            const isCenter = position === 1;
            const isMember = isUserMember(community.id);

            return (
              <div
                key={`${community.id}-${position}`}
                className={`transition-all duration-500 ease-out ${
                  isCenter
                    ? 'w-[400px] scale-100 opacity-100 z-10'
                    : 'w-[320px] scale-95 opacity-60 blur-[1px]'
                }`}
              >
                <div
                  className="relative rounded-xl overflow-hidden border border-gray-700/50 h-full group"
                  style={{
                    background: community.banner_gradient || gradients[index % gradients.length],
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />

                  {community.is_trending && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-medium text-orange-400">
                          {t('communitiesPage.featured.trending')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 p-4 sm:p-5 flex flex-col h-full min-h-[200px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 100%)`,
                          boxShadow: `0 0 20px ${primaryColor}30`,
                        }}
                      >
                        <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate text-lg">
                          # {community.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {community.member_count}
                          </span>
                          {community.online_count > 0 && (
                            <span className="flex items-center gap-1 text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              {community.online_count} {t('communitiesPage.featured.online')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {community.description && (
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3 flex-1">
                        {community.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-700/50">
                      {community.last_activity && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(community.last_activity), {
                            addSuffix: true,
                          })}
                        </div>
                      )}

                      {isMember ? (
                        <button
                          onClick={() =>
                            onOpen(community.id, community.name, community.description)
                          }
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
                            boxShadow: `0 0 20px ${primaryColor}30`,
                          }}
                        >
                          {t('communitiesPage.open')}
                        </button>
                      ) : (
                        <button
                          onClick={() => onJoin(community.id)}
                          disabled={isJoining}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: `linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryColor}CC 100%)`,
                            boxShadow: `0 0 20px ${secondaryColor}30`,
                          }}
                        >
                          {isJoining
                            ? t('communitiesPage.joining')
                            : t('communitiesPage.join')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="md:hidden">
          {communities.map((community, index) => {
            const isMember = isUserMember(community.id);
            if (index !== currentIndex) return null;

            return (
              <div
                key={community.id}
                className="transition-all duration-500"
              >
                <div
                  className="relative rounded-xl overflow-hidden border border-gray-700/50"
                  style={{
                    background: community.banner_gradient || gradients[index % gradients.length],
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />

                  {community.is_trending && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-medium text-orange-400">
                          {t('communitiesPage.featured.trending')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 p-4 flex flex-col min-h-[180px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 100%)`,
                        }}
                      >
                        <MessageSquare className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          # {community.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {community.member_count}
                          </span>
                          {community.online_count > 0 && (
                            <span className="flex items-center gap-1 text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              {community.online_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {community.description && (
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3 flex-1">
                        {community.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      {isMember ? (
                        <button
                          onClick={() =>
                            onOpen(community.id, community.name, community.description)
                          }
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
                          }}
                        >
                          {t('communitiesPage.open')}
                        </button>
                      ) : (
                        <button
                          onClick={() => onJoin(community.id)}
                          disabled={isJoining}
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 disabled:opacity-50"
                          style={{
                            background: `linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryColor}CC 100%)`,
                          }}
                        >
                          {isJoining
                            ? t('communitiesPage.joining')
                            : t('communitiesPage.join')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {communities.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {communities.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-6 h-2'
                  : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
              }`}
              style={index === currentIndex ? { backgroundColor: primaryColor } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
