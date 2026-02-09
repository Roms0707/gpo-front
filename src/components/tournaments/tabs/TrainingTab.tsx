import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Loader, ExternalLink, Video, FileText, Music, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Tournament } from '../../../types';
import { syncGalaxyContent } from '../../../services/api';
import toast from 'react-hot-toast';
import VideoCard from '../../ui/VideoCard';
import { useGameContent } from '../../../hooks/useGameContent';
import { useAppConfig } from '../../../contexts/AppConfigContext';

interface TrainingTabProps {
  tournament: Tournament;
  gameName: string;
}

const TrainingTab: React.FC<TrainingTabProps> = ({
  tournament,
  gameName
}) => {
  const { t } = useTranslation();
  const { configId } = useAppConfig();
  const [isSyncing, setIsSyncing] = useState(false);

  // Use the enhanced useGameContent hook
  const {
    contentTypes,
    isLoadingTypes,
    selectedContentType,
    setSelectedContentType,
    loadMoreContent,
    loadContentType,
    loadMoreAllContent,
    getCurrentContent,
    getCurrentLoadingState,
    getCurrentHasMore,
    groupedContent
  } = useGameContent('training', tournament?.game_id);

  // Handle Galaxy content sync
  const handleSyncGalaxyContent = async () => {
    try {
      setIsSyncing(true);
      const result = await syncGalaxyContent(configId);
      const syncCount = result.stats?.total_synced || 0;
      toast.success(t('trainingTab.syncSuccess', { count: syncCount }));

      // Reload the page to show new content
      window.location.reload();
    } catch (error) {
      console.error('Error syncing Galaxy content:', error);
      toast.error(t('trainingTab.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Get content type label from translations
  const getContentTypeLabel = (type: string): string => {
    const translationKey = `trainingTab.contentTypes.${type}`;
    const translated = t(translationKey);
    // Fallback to capitalized type if translation key doesn't exist
    return translated !== translationKey ? translated : type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get icon for content type
  const getContentTypeIcon = (type: string): React.ReactNode => {
    switch (type.toLowerCase()) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'playlist':
        return <Music className="h-4 w-4" />;
      case 'news':
      case 'article':
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  // Load more content for a specific type
  const handleLoadMoreContentType = async (type: string) => {
    await loadMoreContent(type);
  };

  // Load initial content for a specific type when it's selected
  const handleContentTypeSelect = (type: string | null) => {
    setSelectedContentType(type);

    // Load initial content for this type if not already loaded
    if (type && (!groupedContent[type] || groupedContent[type].videos.length === 0)) {
      loadContentType(type);
    }
  };

  const currentContent = getCurrentContent();
  const isLoadingContent = getCurrentLoadingState();
  const hasMoreContent = getCurrentHasMore();
  const totalContentCount = contentTypes.reduce((sum, type) => sum + type.count, 0);

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-gray-800" role="tabpanel" id="training-panel" aria-labelledby="training-tab">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading font-bold text-xl sm:text-2xl flex flex-wrap items-center text-gray-900 dark:text-white">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500 mr-2" />
          <span className="break-words">{t('trainingTab.title', { gameName: gameName || tournament?.game })}</span>
          {totalContentCount > 0 && (
            <span className="ml-2 text-xs sm:text-sm bg-primary-600/20 text-primary-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
              {t('trainingTab.contents', { count: totalContentCount })}
            </span>
          )}
        </h2>

        {/* Sync Button for Galaxy Content */}
        <button
          onClick={handleSyncGalaxyContent}
          disabled={isSyncing}
          className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-secondary-600/50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center text-sm sm:text-base whitespace-nowrap flex-shrink-0"
          title={t('trainingTab.syncGalaxyContent')}
        >
          <RefreshCw className={`h-4 w-4 sm:mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? t('trainingTab.syncing') : t('trainingTab.syncGalaxy')}</span>
        </button>
      </div>

      {isLoadingTypes ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">{t('trainingTab.loading')}</span>
        </div>
      ) : totalContentCount > 0 ? (
        <>
          {/* Content Type Filters */}
          {contentTypes.length > 1 && (
            <div className="mb-8">
              <h3 className="font-heading font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                {t('trainingTab.filterByType')}
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => handleContentTypeSelect(null)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center whitespace-nowrap ${
                    selectedContentType === null
                      ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-200 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-300 hover:shadow-md'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span>{t('trainingTab.all')}</span>
                  <span className="ml-1.5 sm:ml-2 bg-white/20 text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                    {totalContentCount}
                  </span>
                </button>

                {contentTypes.map(contentType => (
                  <button
                    key={contentType.type}
                    onClick={() => handleContentTypeSelect(contentType.type)}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center whitespace-nowrap ${
                      selectedContentType === contentType.type
                        ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-200 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-300 hover:shadow-md'
                    }`}
                  >
                    <span className="flex-shrink-0">{getContentTypeIcon(contentType.type)}</span>
                    <span className="ml-1.5 sm:ml-2">{getContentTypeLabel(contentType.type)}</span>
                    <span className="ml-1.5 sm:ml-2 bg-white/20 text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                      {contentType.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Display */}
          <div className="space-y-8">
            {selectedContentType ? (
              /* Single content type view */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-semibold text-xl flex items-center text-gray-900 dark:text-white">
                    {getContentTypeIcon(selectedContentType)}
                    <span className="ml-2">
                      {getContentTypeLabel(selectedContentType)}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('trainingTab.contentCount', { current: groupedContent[selectedContentType]?.videos.length || 0, total: groupedContent[selectedContentType]?.totalCount || 0 })}
                    </span>
                  </h3>
                </div>

                {/* Loading state for initial content load */}
                {isLoadingContent && currentContent.length === 0 ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">{t('trainingTab.loadingType', { type: getContentTypeLabel(selectedContentType).toLowerCase() })}</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentContent.map(content => (
                        <VideoCard
                          key={content.id}
                          content={content}
                          showMetadata={true}
                        />
                      ))}
                    </div>

                    {/* Load More Button for Single Type */}
                    {hasMoreContent && (
                      <div className="text-center mt-8">
                        <button
                          onClick={() => handleLoadMoreContentType(selectedContentType)}
                          disabled={isLoadingContent}
                          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors flex items-center mx-auto text-sm sm:text-base"
                        >
                          {isLoadingContent ? (
                            <>
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                              <span className="hidden sm:inline">{t('trainingTab.loading')}</span>
                              <span className="sm:hidden">{t('trainingTab.loading')}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">{t('trainingTab.loadMoreType', { type: getContentTypeLabel(selectedContentType).toLowerCase() })}</span>
                              <span className="sm:hidden">{t('trainingTab.loadMore')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* All content types view */
              <>
                {/* Loading state for all content */}
                {isLoadingContent && currentContent.length === 0 ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-primary-500" />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">{t('trainingTab.loadingAll')}</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentContent.map(content => (
                        <VideoCard
                          key={content.id}
                          content={content}
                          showMetadata={true}
                        />
                      ))}
                    </div>

                    {/* Load More Button for All Content */}
                    {hasMoreContent && (
                      <div className="text-center mt-8">
                        <button
                          onClick={loadMoreAllContent}
                          disabled={isLoadingContent}
                          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors flex items-center mx-auto text-sm sm:text-base"
                        >
                          {isLoadingContent ? (
                            <>
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                              <span>{t('trainingTab.loading')}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">{t('trainingTab.loadMoreContents')}</span>
                              <span className="sm:hidden">{t('trainingTab.loadMore')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Back to All Button when filtering */}
          {selectedContentType && (
            <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleContentTypeSelect(null)}
                className="bg-gray-200 dark:bg-dark-200 hover:bg-gray-300 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center mx-auto text-sm sm:text-base"
              >
                <ChevronUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('trainingTab.backToAll')}</span>
                <span className="sm:hidden">{t('trainingTab.backToAllShort')}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-2 text-gray-900 dark:text-white">
            {t('trainingTab.noContent')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('trainingTab.noContentDescription', { gameName: gameName || tournament?.game })}
          </p>
          <button
            onClick={handleSyncGalaxyContent}
            disabled={isSyncing}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors flex items-center mx-auto text-sm sm:text-base"
          >
            {isSyncing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">{t('trainingTab.syncInProgress')}</span>
                <span className="sm:hidden">{t('trainingTab.syncing')}</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('trainingTab.syncGalaxyContent')}</span>
                <span className="sm:hidden">{t('trainingTab.syncGalaxy')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrainingTab;
