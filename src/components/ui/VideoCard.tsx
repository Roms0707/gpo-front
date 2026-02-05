import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Calendar, Globe } from 'lucide-react';
import { GameContent } from '../../types';
import ExpandableText from './ExpandableText';

interface VideoCardProps {
  content: GameContent;
  className?: string;
  showMetadata?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  content, 
  className = '',
  showMetadata = true 
}) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Link
      to={`/video/${content.id}`}
      className={`block bg-white dark:bg-dark-200 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Video Thumbnail */}
      <div className="relative h-32 sm:h-36 md:h-40 overflow-hidden">
        <img 
          src={content.playlist_image_url || 'https://images.pexels.com/photos/7915311/pexels-photo-7915311.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
          alt={content.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-primary-600 bg-opacity-90 rounded-full flex items-center justify-center">
            <Play className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white ml-1" />
          </div>
        </div>
        
        {/* Duration Badge */}
        {content.duration && (
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black bg-opacity-70 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
            {formatDuration(content.duration)}
          </div>
        )}

        {/* Content Type Badge */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black bg-opacity-70 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
          Vidéo
        </div>
      </div>
      
      {/* Video Info */}
      <div className="p-3 sm:p-4">
        <div className="text-[10px] sm:text-xs text-primary-400 uppercase mb-1">{content.content_type}</div>
        <h3 className="font-heading font-bold text-base sm:text-lg mb-1.5 sm:mb-2 text-gray-900 dark:text-white line-clamp-2">
          {content.title}
        </h3>
        <div className="mb-1.5 sm:mb-2">
          <ExpandableText
            text={content.description}
            maxLines={2}
            maxLinesMobile={2}
            maxLinesTablet={2}
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
            showGradient={false}
          />
        </div>
        
        {/* Video Metadata */}
        {showMetadata && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-1.5 sm:mt-2">
            {content.duration && (
              <div className="flex items-center">
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                <span>{formatDuration(content.duration)}</span>
              </div>
            )}
            {content.product_year && (
              <div className="flex items-center">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                <span>{content.product_year}</span>
              </div>
            )}
            {content.product_country && (
              <div className="flex items-center">
                <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                <span className="truncate max-w-[100px] sm:max-w-none">{content.product_country}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default VideoCard;