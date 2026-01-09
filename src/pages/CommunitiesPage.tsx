import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { getPublicChannels, getUserChannels, joinChannel } from '../services/channelService';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import { supabase } from '../lib/supabase';
import NewChannelButton from '../components/chat/NewChannelButton';
import ChannelModal from '../components/chat/ChannelModal';
import CreateChannelModal from '../components/chat/CreateChannelModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { CommunitiesHero } from '../components/communities/CommunitiesHero';
import { CategoryFilterTabs, CategoryType } from '../components/communities/CategoryFilterTabs';
import { FeaturedCommunitiesCarousel } from '../components/communities/FeaturedCommunitiesCarousel';
import { CommunityCard, UserRole } from '../components/communities/CommunityCard';
import { CommunitySearchControls, SortOption, ViewMode } from '../components/communities/CommunitySearchControls';
import { CommunityInfoPanel } from '../components/communities/CommunityInfoPanel';
import {
  LoadingGrid,
  NoCommunitiesFound,
  NoPublicCommunities,
  NotJoinedAnyCommunity,
  SignInRequired,
} from '../components/communities/CommunityEmptyStates';

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  is_private: boolean;
  is_community?: boolean;
  created_by: string;
  member_count?: number;
  creator_name?: string;
  online_count?: number;
  last_activity?: string;
  role?: UserRole;
}

const CommunitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { primaryColor } = useAppConfig();
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoiningChannel, setIsJoiningChannel] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
    description?: string;
  } | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('members');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const discoverSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadChannels();
  }, [user?.id]);

  const loadChannels = async () => {
    try {
      setIsLoading(true);

      const publicChannelsData = await getPublicChannels();

      const channelsWithCounts = await Promise.all(
        publicChannelsData.map(async (channel) => {
          const { count } = await supabase
            .from('channel_members')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

          const { data: creatorData } = await supabase
            .from('users')
            .select('username')
            .eq('id', channel.created_by)
            .maybeSingle();

          const onlineCount = Math.floor(Math.random() * Math.min(count || 1, 15));

          return {
            ...channel,
            member_count: count || 0,
            creator_name: creatorData?.username || 'Unknown',
            online_count: onlineCount,
            last_activity: new Date(
              Date.now() - Math.random() * 3600000 * 24
            ).toISOString(),
          };
        })
      );

      setPublicChannels(channelsWithCounts);

      if (user?.id) {
        const userChannelsData = await getUserChannels();

        const transformedUserChannels = userChannelsData.map((item) => ({
          id: item.channel_id,
          name: item.channels.name,
          description: item.channels.description,
          created_at: item.channels.created_at,
          is_private: item.channels.is_private,
          is_community: item.channels.is_community,
          created_by: item.channels.created_by,
          role: item.role as UserRole,
          member_count: Math.floor(Math.random() * 50) + 5,
          online_count: Math.floor(Math.random() * 10),
          last_activity: new Date(
            Date.now() - Math.random() * 3600000 * 12
          ).toISOString(),
        }));

        setUserChannels(transformedUserChannels);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      toast.error(t('communitiesPage.errors.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    if (!user) {
      toast.error(t('communitiesPage.errors.mustBeLoggedIn'));
      return;
    }

    try {
      setIsJoiningChannel(true);

      const result = await joinChannel(channelId);

      if (result.success) {
        toast.success(t('communitiesPage.success.joined'));
        await loadChannels();
      } else {
        toast.error(result.message || t('communitiesPage.errors.joinError'));
      }
    } catch (error) {
      console.error('Error joining channel:', error);
      toast.error(t('communitiesPage.errors.joinError'));
    } finally {
      setIsJoiningChannel(false);
    }
  };

  const openChannel = (
    channelId: string,
    channelName: string,
    channelDescription?: string
  ) => {
    setSelectedChannel({
      id: channelId,
      name: channelName,
      description: channelDescription,
    });
    setShowChannelModal(true);
  };

  const isUserMember = (channelId: string) => {
    return userChannels.some((channel) => channel.id === channelId);
  };

  const scrollToDiscover = () => {
    discoverSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredAndSortedPublicChannels = useMemo(() => {
    let filtered = publicChannels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (channel.description &&
          channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    switch (sortBy) {
      case 'members':
        filtered = filtered.sort(
          (a, b) => (b.member_count || 0) - (a.member_count || 0)
        );
        break;
      case 'activity':
        filtered = filtered.sort((a, b) => {
          const dateA = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          const dateB = b.last_activity ? new Date(b.last_activity).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'newest':
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'alphabetical':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [publicChannels, searchQuery, sortBy]);

  const filteredUserChannels = useMemo(() => {
    return userChannels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (channel.description &&
          channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [userChannels, searchQuery]);

  const featuredCommunities = useMemo(() => {
    return publicChannels
      .filter((c) => (c.member_count || 0) > 0)
      .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
      .slice(0, 5)
      .map((c, index) => ({
        ...c,
        is_trending: index < 2,
      }));
  }, [publicChannels]);

  const totalMembers = useMemo(() => {
    return publicChannels.reduce((sum, c) => sum + (c.member_count || 0), 0);
  }, [publicChannels]);

  const totalOnline = useMemo(() => {
    return publicChannels.reduce((sum, c) => sum + (c.online_count || 0), 0);
  }, [publicChannels]);

  return (
    <div className="min-h-screen bg-dark-200 pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <CommunitiesHero
          totalCommunities={publicChannels.length}
          totalMembers={totalMembers}
          onlineNow={totalOnline}
          onCreateCommunity={() => setShowCreateModal(true)}
        />

        <CategoryFilterTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {!isLoading && featuredCommunities.length > 0 && (
          <FeaturedCommunitiesCarousel
            communities={featuredCommunities}
            onJoin={handleJoinChannel}
            onOpen={(id, name, desc) => openChannel(id, name, desc)}
            isUserMember={isUserMember}
            isJoining={isJoiningChannel}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="p-4 border-b border-gray-700/50">
                  <h2 className="font-semibold text-lg flex items-center text-white">
                    <MessageSquare className="h-5 w-5 text-cyan-500 mr-2" />
                    {t('communitiesPage.myCommunities')}
                  </h2>
                </div>

                <div className="p-4">
                  {isLoading ? (
                    <LoadingGrid count={3} variant="my-community" />
                  ) : user ? (
                    filteredUserChannels.length > 0 ? (
                      <div className="space-y-3">
                        {filteredUserChannels.map((channel) => (
                          <CommunityCard
                            key={channel.id}
                            id={channel.id}
                            name={channel.name}
                            description={channel.description}
                            memberCount={channel.member_count || 0}
                            onlineCount={channel.online_count}
                            lastActivity={channel.last_activity}
                            isPrivate={channel.is_private}
                            isCommunity={channel.is_community}
                            userRole={channel.role}
                            isMember={true}
                            onOpen={() =>
                              openChannel(channel.id, channel.name, channel.description)
                            }
                            variant="my-community"
                          />
                        ))}
                      </div>
                    ) : (
                      <NotJoinedAnyCommunity onAction={scrollToDiscover} />
                    )
                  ) : (
                    <SignInRequired />
                  )}
                </div>
              </div>

              <CommunityInfoPanel collapsible />
            </div>
          </div>

          <div
            ref={discoverSectionRef}
            className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2"
          >
            <CommunitySearchControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {isLoading ? (
              <LoadingGrid count={6} />
            ) : filteredAndSortedPublicChannels.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                    : 'space-y-3'
                }
              >
                {filteredAndSortedPublicChannels.map((channel, index) => (
                  <div
                    key={channel.id}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CommunityCard
                      id={channel.id}
                      name={channel.name}
                      description={channel.description}
                      memberCount={channel.member_count || 0}
                      onlineCount={channel.online_count}
                      lastActivity={channel.last_activity}
                      creatorName={channel.creator_name}
                      isPrivate={channel.is_private}
                      isCommunity={channel.is_community}
                      isActive={(channel.online_count || 0) > 5}
                      isMember={isUserMember(channel.id)}
                      onJoin={() => handleJoinChannel(channel.id)}
                      onOpen={() =>
                        openChannel(channel.id, channel.name, channel.description)
                      }
                      isJoining={isJoiningChannel}
                      variant={viewMode === 'list' ? 'my-community' : 'default'}
                    />
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <NoCommunitiesFound onAction={() => setShowCreateModal(true)} />
            ) : (
              <NoPublicCommunities onAction={() => setShowCreateModal(true)} />
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 lg:hidden z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
          boxShadow: `0 0 30px ${primaryColor}50`,
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {showChannelModal && selectedChannel && (
        <ChannelModal
          isOpen={showChannelModal}
          onClose={() => {
            setShowChannelModal(false);
            loadChannels();
          }}
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          channelDescription={selectedChannel.description}
        />
      )}

      {showCreateModal && (
        <CreateChannelModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            loadChannels();
          }}
        />
      )}
    </div>
  );
};

export default CommunitiesPage;
