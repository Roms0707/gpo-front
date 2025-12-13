import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
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

const PillNav: React.FC<PillNavProps> = ({ items, className = '' }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getActiveIndex = () => {
    return items.findIndex((item) => {
      if (item.href === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.href);
    });
  };

  const activeIndex = getActiveIndex();

  const updatePillPosition = (index: number, animate = true) => {
    const targetElement = itemRefs.current[index];
    const pillElement = pillRef.current;
    const navElement = navRef.current;

    if (!targetElement || !pillElement || !navElement) return;

    const navRect = navElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const left = targetRect.left - navRect.left;
    const width = targetRect.width;

    if (animate) {
      gsap.to(pillElement, {
        x: left,
        width: width,
        duration: 0.35,
        ease: 'power2.out',
      });
    } else {
      gsap.set(pillElement, {
        x: left,
        width: width,
      });
    }
  };

  useLayoutEffect(() => {
    const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
    if (targetIndex >= 0) {
      updatePillPosition(targetIndex, true);
    }
  }, [hoveredIndex, activeIndex, items]);

  useEffect(() => {
    if (activeIndex >= 0) {
      updatePillPosition(activeIndex, false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const targetIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
      if (targetIndex >= 0) {
        updatePillPosition(targetIndex, false);
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
        ref={pillRef}
        className={`absolute top-1 bottom-1 rounded-full transition-colors duration-200 ${
          isDark
            ? 'bg-primary-600/90'
            : 'bg-primary-500/90'
        }`}
        style={{ zIndex: 0 }}
      />

      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const isHovered = index === hoveredIndex;
        const showHighlight = isActive || isHovered;

        const commonProps = {
          ref: (el: HTMLAnchorElement | HTMLButtonElement | null) => {
            itemRefs.current[index] = el;
          },
          className: `relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
            showHighlight
              ? 'text-white'
              : isDark
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`,
          onMouseEnter: () => handleMouseEnter(index),
          onMouseLeave: handleMouseLeave,
        };

        const content = (
          <>
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
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
              onClick={item.onClick}
              type="button"
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={item.href} to={item.href} {...commonProps}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
};

export default PillNav;
