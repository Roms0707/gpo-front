import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  maxLinesMobile?: number;
  maxLinesTablet?: number;
  className?: string;
  buttonClassName?: string;
  showGradient?: boolean;
  expandText?: string;
  collapseText?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLines = 3,
  maxLinesMobile = 2,
  maxLinesTablet = 3,
  className = '',
  buttonClassName = '',
  showGradient = true,
  expandText,
  collapseText
}) => {
  const { t } = useTranslation();
  const expandLabel = expandText || t('common.viewMore');
  const collapseLabel = collapseText || t('common.viewLess');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const element = textRef.current;
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
        let currentMaxLines = maxLines;

        if (isMobile) {
          currentMaxLines = maxLinesMobile;
        } else if (isTablet) {
          currentMaxLines = maxLinesTablet;
        }

        const maxHeight = lineHeight * currentMaxLines;
        setIsTruncated(element.scrollHeight > maxHeight);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);

    return () => window.removeEventListener('resize', checkTruncation);
  }, [text, maxLines, maxLinesMobile, maxLinesTablet, isMobile, isTablet]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getLineClampClass = () => {
    if (isExpanded) return '';

    let currentMaxLines = maxLines;
    if (isMobile) {
      currentMaxLines = maxLinesMobile;
    } else if (isTablet) {
      currentMaxLines = maxLinesTablet;
    }

    if (currentMaxLines === 1) return 'line-clamp-1';
    if (currentMaxLines === 2) return 'line-clamp-2';
    if (currentMaxLines === 3) return 'line-clamp-3';
    if (currentMaxLines === 4) return 'line-clamp-4';
    if (currentMaxLines === 5) return 'line-clamp-5';
    if (currentMaxLines === 6) return 'line-clamp-6';
    return 'line-clamp-3';
  };

  return (
    <div className="relative">
      <div className="relative">
        <div
          ref={textRef}
          className={`${className} ${getLineClampClass()}`}
        >
          {text}
        </div>
      </div>

      {isTruncated && (
        <button
          onClick={toggleExpanded}
          className={`inline-flex items-center gap-1 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-200 rounded px-2 py-1.5 sm:px-0 sm:py-0 min-h-[44px] sm:min-h-0 active:scale-95 ${buttonClassName}`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? collapseLabel : expandLabel}
        >
          <span>{isExpanded ? collapseLabel : expandLabel}</span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
