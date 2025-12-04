import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Users, Plus, Info, Globe, Lock, ArrowRight, Loader } from 'lucide-react';
import { getPublicChannels, getUserChannels, joinChannel } from '../services/channelService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NewChannelButton from '../components/chat/NewChannelButton';
import ChannelModal from '../components/chat/ChannelModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
}

const CommunitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoiningChannel, setIsJoiningChannel] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string, description?: string} | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    loadChannels();
  }, [user?.id]);

  const loadChannels = async () => {
    try {
      setIsLoading(true);

      // Load public channels
      const publicChannelsData = await getPublicChannels();

      // Get member counts for each channel
      const channelsWithCounts = await Promise.all(
        publicChannelsData.map(async (channel) => {
          // Get member count
          const { count, error } = await supabase
            .from('channel_members')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

          // Get creator name
          const { data: creatorData, error: creatorError } = await supabase
            .from('users')
            .select('username')
            .eq('id', channel.created_by)
            .single();

          return {
            ...channel,
            member_count: count || 0,
            creator_name: creatorData?.username || 'Unknown'
          };
        })
      );

      setPublicChannels(channelsWithCounts);

      // If user is logged in, load their channels
      if (user?.id) {
        const userChannelsData = await getUserChannels();

        // Transform the data
        const transformedUserChannels = userChannelsData.map(item => ({
          id: item.channel_id,
          name: item.channels.name,
          description: item.channels.description,
          created_at: item.channels.created_at,
          is_private: item.channels.is_private,
          is_community: item.channels.is_community,
          created_by: item.channels.created_by,
          role: item.role
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

        // Refresh channels lists
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

  const openChannel = (channelId: string, channelName: string, channelDescription?: string) => {
    setSelectedChannel({
      id: channelId,
      name: channelName,
      description: channelDescription
    });
    setShowChannelModal(true);
  };

  // Filter channels based on search query
  const filteredPublicChannels = publicChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUserChannels = userChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if user is already a member of a channel
  const isUserMember = (channelId: string) => {
    return userChannels.some(channel => channel.id === channelId);
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-full">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 px-2">
              <span className="gradient-text">{t('communitiesPage.title')}</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              {t('communitiesPage.subtitle')}
            </p>

            <div className="flex justify-center">
              <NewChannelButton />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder={t('communitiesPage.search')}
                className="w-full bg-dark-100 border border-gray-700 rounded-lg pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - My Communities */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="font-heading font-semibold text-lg sm:text-xl flex items-center text-gray-900 dark:text-white">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2" />
                    {t('communitiesPage.myCommunities')}
                  </h2>
                </div>

                <div className="p-3 sm:p-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-6 sm:py-8">
                      <Loader className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary-500 mr-2" />
                      <span className="text-sm sm:text-base text-gray-400">{t('communitiesPage.loading')}</span>
                    </div>
                  ) : user ? (
                    filteredUserChannels.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {filteredUserChannels.map(channel => (
                          <div
                            key={channel.id}
                            className="bg-gray-100 dark:bg-dark-200 p-3 sm:p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors cursor-pointer"
                            onClick={() => openChannel(channel.id, channel.name, channel.description)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-100 dark:bg-primary-600/20 overflow-hidden mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0">
                                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium flex items-center text-sm sm:text-base text-gray-900 dark:text-white">
                                    <span className="truncate"># {channel.name}</span>
                                    {channel.is_community && (
                                      <Globe className="h-3 w-3 text-primary-500 ml-1 flex-shrink-0" title={t('communitiesPage.community')} />
                                    )}
                                    {channel.is_private && (
                                      <Lock className="h-3 w-3 text-gray-500 ml-1 flex-shrink-0" title={t('communitiesPage.private')} />
                                    )}
                                  </h3>
                                  {channel.description && (
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 line-clamp-1">{channel.description}</p>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 px-4">
                        <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">{t('communitiesPage.noCommunities')}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                          {t('communitiesPage.noCommunitiesDesc')}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-6 sm:py-8 px-4">
                      <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">{t('communitiesPage.signInToView')}</p>
                      <a
                        href="/login"
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm sm:text-base rounded-lg inline-block transition-colors"
                      >
                        {t('communitiesPage.signIn')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Public Communities */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="font-heading font-semibold text-lg sm:text-xl flex items-center text-gray-900 dark:text-white">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 mr-2" />
                    {t('communitiesPage.publicCommunities')}
                  </h2>
                </div>

                <div className="p-3 sm:p-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-6 sm:py-8">
                      <Loader className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary-500 mr-2" />
                      <span className="text-sm sm:text-base text-gray-400">{t('communitiesPage.loading')}</span>
                    </div>
                  ) : filteredPublicChannels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {filteredPublicChannels.map(channel => (
                        <div
                          key={channel.id}
                          className="bg-gray-100 dark:bg-dark-200 p-3 sm:p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
                        >
                          <div className="flex items-center mb-2 sm:mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-600/20 overflow-hidden mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium flex items-center text-sm sm:text-base text-gray-900 dark:text-white">
                                <span className="truncate"># {channel.name}</span>
                                {channel.is_community && (
                                  <Globe className="h-3 w-3 text-primary-500 ml-1 flex-shrink-0" title={t('communitiesPage.community')} />
                                )}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {t('communitiesPage.by')} {channel.creator_name}
                              </p>
                            </div>
                          </div>

                          {channel.description && (
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-2">{channel.description}</p>
                          )}

                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
                            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center flex-wrap gap-1">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{channel.member_count} {t('communitiesPage.members')}</span>
                            </div>

                            {isUserMember(channel.id) ? (
                              <button
                                onClick={() => openChannel(channel.id, channel.name, channel.description)}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm transition-colors w-full sm:w-auto"
                              >
                                {t('communitiesPage.open')}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJoinChannel(channel.id)}
                                disabled={isJoiningChannel}
                                className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm transition-colors w-full sm:w-auto"
                              >
                                {isJoiningChannel ? t('communitiesPage.joining') : t('communitiesPage.join')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 px-4">
                      <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                        {searchQuery ? t('communitiesPage.noCommunitiesFound') : t('communitiesPage.noPublicCommunities')}
                      </p>
                      <div className="mt-4">
                        <NewChannelButton />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-white dark:bg-dark-100 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h3 className="font-medium text-base sm:text-lg mb-2 text-gray-900 dark:text-white">{t('communitiesPage.aboutTitle')}</h3>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">
                      {t('communitiesPage.aboutDesc')}
                    </p>
                    <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-start">
                        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-gray-700 dark:text-gray-300">{t('communitiesPage.openCommunitiesLabel')}</strong> : {t('communitiesPage.openCommunitiesDesc')}</span>
                      </li>
                      <li className="flex items-start">
                        <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong className="text-gray-700 dark:text-gray-300">{t('communitiesPage.privateChannelsLabel')}</strong> : {t('communitiesPage.privateChannelsDesc')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Modal */}
      {showChannelModal && selectedChannel && (
        <ChannelModal
          isOpen={showChannelModal}
          onClose={() => {
            setShowChannelModal(false);
            loadChannels(); // Reload channels when closing modal
          }}
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          channelDescription={selectedChannel.description}
        />
      )}
    </div>
  );
};

export default CommunitiesPage;
