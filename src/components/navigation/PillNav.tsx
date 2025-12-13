import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

export interface PillNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}

interface PillNavProps {
  items: PillNavItem[];
  className?: string;
}

interface PillStyle {
  transform: string;
  width: string;
}

interface RippleState {
  x: number;
  y: number;
  id: number;
}

const PillNav: React.FC<PillNavProps> = ({ items, className = '' }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pillStyle, setPillStyle] = useState<PillStyle>({ transform: 'translateX(0)', width: '0px' });
  const [isInitialized, setIsInitialized] = useState(false);
  const [ripples, setRipples] = useState<{ [key: number]: RippleState[] }>({});
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const rippleIdRef = useRef(0);

  const getActiveIndex = () => {
    return items.findIndex((item) => {
      if (item.href === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.href);
    });
  };

  const activeIndex = getActiveIndex();

  const updatePillPosition = (index: number) => {
    const targetElement = itemRefs.current[index];
    const navElement = navRef.current;

    if (!targetElement || !navElement) return;

    const navRect = navElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const left = targetRect.left - navRect.left;
    const width = targetRect.width;

    setPillStyle({
      transform: `translateX(${left}px)`,
      width: `${width}px`,
    });
  };

  useLayoutEffect(() => {
    const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
    if (targetIndex >= 0) {
      updatePillPosition(targetIndex);
      if (!isInitialized) {
        setTimeout(() => setIsInitialized(true), 50);
      }
    }
  }, [hoveredIndex, activeIndex, items]);

  useEffect(() => {
    if (activeIndex >= 0) {
      updatePillPosition(activeIndex);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
      if (targetIndex >= 0) {
        updatePillPosition(targetIndex);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hoveredIndex, activeIndex]);

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const createRipple = useCallback((event: React.MouseEvent, index: number) => {
    const element = itemRefs.current[index];
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = rippleIdRef.current++;

    setRipples(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), { x, y, id }]
    }));

    setTimeout(() => {
      setRipples(prev => ({
        ...prev,
        [index]: (prev[index] || []).filter(r => r.id !== id)
      }));
    }, 500);
  }, []);

  const handleMouseDown = (index: number) => {
    setPressedIndex(index);
  };

  const handleMouseUp = () => {
    setPressedIndex(null);
  };

  const isDark = theme === 'dark';

  return (
    <nav
      ref={navRef}
      className={`relative flex items-center rounded-full p-1 ${
        isDark
          ? 'bg-dark-100/80 border border-gray-700/50'
          : 'bg-gray-100/80 border border-gray-200/50'
      } backdrop-blur-sm ${className}`}
    >
      <div
        className={`absolute top-1 bottom-1 rounded-full ${
          isDark ? 'bg-primary-600/90' : 'bg-primary-500/90'
        } ${isInitialized ? 'transition-all duration-300' : ''}`}
        style={{
          ...pillStyle,
          zIndex: 0,
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isDark
            ? '0 0 12px rgba(var(--color-primary-500), 0.3)'
            : '0 0 8px rgba(var(--color-primary-500), 0.25)',
        }}
      />

      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const isHovered = index === hoveredIndex;
        const showHighlight = isActive || isHovered;

        const isPressed = index === pressedIndex;
        const itemRipples = ripples[index] || [];

        const commonProps = {
          ref: (el: HTMLAnchorElement | HTMLButtonElement | null) => {
            itemRefs.current[index] = el;
          },
          className: `relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-150 overflow-hidden ${
            showHighlight
              ? 'text-white'
              : isDark
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`,
          style: {
            transform: isPressed ? 'scale(0.97)' : 'scale(1)',
          },
          onMouseEnter: () => handleMouseEnter(index),
          onMouseLeave: () => {
            handleMouseLeave();
            handleMouseUp();
          },
          onMouseDown: () => handleMouseDown(index),
          onMouseUp: handleMouseUp,
          onClick: (e: React.MouseEvent) => createRipple(e, index),
        };

        const content = (
          <>
            {itemRipples.map(ripple => (
              <span
                key={ripple.id}
                className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            {item.icon && (
              <span
                className={`w-4 h-4 transition-transform duration-300 ${
                  isHovered ? 'animate-bounce-subtle' : ''
                }`}
              >
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                  showHighlight
                    ? 'bg-white/20 text-white'
                    : 'bg-primary-600 text-white'
                }`}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </>
        );

        if (item.onClick) {
          return (
            <button
              key={item.href}
              {...commonProps}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                createRipple(e, index);
                item.onClick?.();
              }}
              type="button"
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            to={item.href}
            {...commonProps}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => createRipple(e, index)}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
};

export default PillNav;
