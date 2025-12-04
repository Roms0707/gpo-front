import React, { useState } from 'react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Trophy } from 'lucide-react';

interface DynamicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBrandName?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-auto',
  md: 'h-12 w-auto',
  lg: 'h-16 w-auto',
  xl: 'h-20 w-auto',
};

export const DynamicLogo: React.FC<DynamicLogoProps> = ({
  size = 'md',
  className = '',
  showBrandName = false
}) => {
  const { logo, logoAltText, brandName, isLoading } = useAppConfig();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    console.error('Failed to load logo:', logo);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses[size]} bg-gray-700 animate-pulse rounded`} />
        {showBrandName && (
          <div className="h-4 w-24 bg-gray-700 animate-pulse rounded" />
        )}
      </div>
    );
  }

  if (imageError) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Trophy className={`${sizeClasses[size].replace('h-', 'w-').replace('w-auto', 'h-auto')} text-primary`} />
        {showBrandName && (
          <span className="font-bold text-lg">{brandName}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img
        src={logo}
        alt={logoAltText}
        className={`${sizeClasses[size]} object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="eager"
      />
      {showBrandName && imageLoaded && (
        <span className="font-bold text-lg">{brandName}</span>
      )}
    </div>
  );
};
