import { useState, useEffect } from 'react';
import { fetchGameContent, fetchGameContentTypesWithCounts } from '../services/api';
import { GameContent } from '../types';

interface ContentGroup {
  videos: GameContent[];
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
  isLoading: boolean;
}

interface ContentTypeWithCount {
  type: string;
  count: number;
}

export const useGameContent = (activeTab: string, gameId?: string) => {
  const [groupedContent, setGroupedContent] = useState<Record<string, ContentGroup>>({});
  const [contentTypes, setContentTypes] = useState<ContentTypeWithCount[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [allContent, setAllContent] = useState<GameContent[]>([]);
  const [allContentPage, setAllContentPage] = useState(1);
  const [allContentHasMore, setAllContentHasMore] = useState(true);
  const [isLoadingAllContent, setIsLoadingAllContent] = useState(false);

  // Load content types with counts when tab becomes active
  useEffect(() => {
    const loadContentTypes = async () => {
      if (activeTab === 'training' && gameId) {
        try {
          setIsLoadingTypes(true);
          const types = await fetchGameContentTypesWithCounts(gameId);
          setContentTypes(types);

          // Initialize grouped content state for each type
          const initialGroupedContent: Record<string, ContentGroup> = {};
          for (const type of types) {
            initialGroupedContent[type.type] = {
              videos: [],
              currentPage: 0,
              hasMore: true,
              totalCount: type.count,
              isLoading: false
            };
          }
          setGroupedContent(initialGroupedContent);

          // Load initial content for "All" view
          loadAllContent(1, true);
        } catch (error) {
          console.error('Error loading content types:', error);
          setContentTypes([]);
        } finally {
          setIsLoadingTypes(false);
        }
      }
    };

    loadContentTypes();
  }, [activeTab, gameId]);

  // Load all content (for "All" filter)
  const loadAllContent = async (page: number = 1, reset: boolean = false) => {
    if (!gameId || isLoadingAllContent) return;

    try {
      setIsLoadingAllContent(true);

      const result = await fetchGameContent(gameId, {
        page,
        limit: 5
      });

      if (reset) {
        setAllContent(result.data);
        setAllContentPage(1);
      } else {
        setAllContent(prev => [...prev, ...result.data]);
      }

      setAllContentHasMore(result.hasMore);
      setAllContentPage(page);
    } catch (error) {
      console.error('Error loading all content:', error);
    } finally {
      setIsLoadingAllContent(false);
    }
  };

  // Load more content for a specific type
  const loadMoreContent = async (contentType: string) => {
    if (!gameId || !groupedContent[contentType] || groupedContent[contentType].isLoading) return;

    const currentGroup = groupedContent[contentType];
    const nextPage = currentGroup.currentPage + 1;

    try {
      // Set loading state for this specific content type
      setGroupedContent(prev => ({
        ...prev,
        [contentType]: {
          ...prev[contentType],
          isLoading: true
        }
      }));

      const result = await fetchGameContent(gameId, {
        contentType,
        page: nextPage,
        limit: 5
      });

      // Update the grouped content for this type
      setGroupedContent(prev => ({
        ...prev,
        [contentType]: {
          videos: [...prev[contentType].videos, ...result.data],
          currentPage: nextPage,
          hasMore: result.hasMore,
          totalCount: result.totalCount,
          isLoading: false
        }
      }));
    } catch (error) {
      console.error(`Error loading more content for type ${contentType}:`, error);

      // Reset loading state on error
      setGroupedContent(prev => ({
        ...prev,
        [contentType]: {
          ...prev[contentType],
          isLoading: false
        }
      }));
    }
  };

  // Load initial content for a specific type
  const loadContentType = async (contentType: string) => {
    if (!gameId || groupedContent[contentType]?.videos.length > 0) return;

    try {
      setGroupedContent(prev => ({
        ...prev,
        [contentType]: {
          ...prev[contentType],
          isLoading: true
        }
      }));

      const result = await fetchGameContent(gameId, {
        contentType,
        page: 1,
        limit: 5
      });

      setGroupedContent(prev => ({
        ...prev,
        [contentType]: {
          videos: result.data,
          currentPage: 1,
          hasMore: result.hasMore,
          totalCount: result.totalCount,
          isLoading: false
        }
      }));
    } catch (error) {
      console.error(`Error loading content for type ${contentType}:`, error);

      setGroupedContent(prev => ({
        ...prev,
        [contentType]: {
          ...prev[contentType],
          isLoading: false
        }
      }));
    }
  };

  // Load more content for "All" view
  const loadMoreAllContent = () => {
    loadAllContent(allContentPage + 1, false);
  };

  // Get current content based on selected filter
  const getCurrentContent = () => {
    if (selectedContentType) {
      return groupedContent[selectedContentType]?.videos || [];
    }
    return allContent;
  };

  // Get current loading state
  const getCurrentLoadingState = () => {
    if (selectedContentType) {
      return groupedContent[selectedContentType]?.isLoading || false;
    }
    return isLoadingAllContent;
  };

  // Get current hasMore state
  const getCurrentHasMore = () => {
    if (selectedContentType) {
      return groupedContent[selectedContentType]?.hasMore || false;
    }
    return allContentHasMore;
  };

  return {
    // Legacy support (for backward compatibility)
    gameContent: getCurrentContent(),
    isLoadingContent: getCurrentLoadingState(),

    // New enhanced API
    contentTypes,
    isLoadingTypes,
    groupedContent,
    selectedContentType,
    setSelectedContentType,
    loadMoreContent,
    loadContentType,
    loadMoreAllContent,
    allContent,
    allContentHasMore,
    isLoadingAllContent,
    getCurrentContent,
    getCurrentLoadingState,
    getCurrentHasMore
  };
};
