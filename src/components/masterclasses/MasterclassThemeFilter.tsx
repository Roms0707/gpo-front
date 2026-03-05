import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface MasterclassThemeFilterProps {
  themes: string[];
  activeTheme: string;
  onThemeChange: (theme: string) => void;
}

const MasterclassThemeFilter: React.FC<MasterclassThemeFilterProps> = ({
  themes,
  activeTheme,
  onThemeChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const allThemes = ['all', ...themes];

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [themes]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const getLabel = (themeValue: string) => {
    if (themeValue === 'all') return t('masterclasses.allThemes');
    return themeValue;
  };

  return (
    <div className="relative">
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDark
              ? 'bg-dark-200/90 hover:bg-dark-100 text-white border border-gray-700/50'
              : 'bg-white/90 hover:bg-white text-gray-700 border border-gray-200 shadow-sm'
          } backdrop-blur-sm`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isDark
              ? 'bg-dark-200/90 hover:bg-dark-100 text-white border border-gray-700/50'
              : 'bg-white/90 hover:bg-white text-gray-700 border border-gray-200 shadow-sm'
          } backdrop-blur-sm`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allThemes.map((themeValue) => {
          const isActive = activeTheme === themeValue;
          return (
            <button
              key={themeValue}
              onClick={() => onThemeChange(themeValue)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : isDark
                  ? 'bg-dark-200/80 text-gray-300 hover:bg-dark-100 hover:text-white border border-gray-700/50'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200/50'
              }`}
            >
              {getLabel(themeValue)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MasterclassThemeFilter;
