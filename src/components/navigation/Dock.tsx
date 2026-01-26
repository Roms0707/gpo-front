import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  PanInfo,
} from 'framer-motion';
import { GripHorizontal } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface DockItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}

interface DockProps {
  items: DockItem[];
  className?: string;
}

interface DockItemComponentProps {
  item: DockItem;
  isActive: boolean;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  isDark: boolean;
}

const DockItemComponent: React.FC<DockItemComponentProps> = ({
  item,
  isActive,
  mouseX,
  isDark,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 64, 48]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const content = (
    <motion.div
      ref={ref}
      style={{ width }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative aspect-square rounded-xl flex items-center justify-center transition-colors duration-200 ${
        isActive
          ? isDark
            ? 'bg-primary-600 text-white'
            : 'bg-primary-500 text-white'
          : isDark
          ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white'
          : 'bg-white/80 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } shadow-lg backdrop-blur-sm`}
    >
      <div className="w-6 h-6">{item.icon}</div>

      {item.badge !== undefined && item.badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary-600 text-white">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              isDark
                ? 'bg-gray-800 text-white border border-gray-700'
                : 'bg-white text-gray-900 border border-gray-200'
            } shadow-lg`}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (item.onClick) {
    return (
      <button
        onClick={item.onClick}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={item.href}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
    >
      {content}
    </Link>
  );
};

const DOCK_POSITION_KEY = 'dock-y-position';
const DEFAULT_BOTTOM = 16;
const MIN_BOTTOM = 16;
const MAX_BOTTOM_OFFSET = 300;

const Dock: React.FC<DockProps> = ({ items, className = '' }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const mouseX = useMotionValue(Infinity);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bottomPosition, setBottomPosition] = useState(() => {
    const saved = localStorage.getItem(DOCK_POSITION_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_BOTTOM;
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem(DOCK_POSITION_KEY, bottomPosition.toString());
  }, [bottomPosition]);

  const getActiveIndex = () => {
    return items.findIndex((item) => {
      if (item.href === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.href);
    });
  };

  const activeIndex = getActiveIndex();

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const newBottom = bottomPosition - info.offset.y;
    const clampedBottom = Math.max(MIN_BOTTOM, Math.min(newBottom, MAX_BOTTOM_OFFSET));
    setBottomPosition(clampedBottom);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      drag="y"
      dragConstraints={{ top: -(MAX_BOTTOM_OFFSET - bottomPosition), bottom: bottomPosition - MIN_BOTTOM }}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ bottom: bottomPosition }}
      className={`fixed left-0 right-0 flex justify-center z-50 md:hidden touch-none ${className}`}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl ${
          isDark
            ? 'bg-dark-100/95 border border-gray-700/50'
            : 'bg-white/95 border border-gray-200/50'
        } backdrop-blur-md shadow-xl ${isDragging ? 'scale-105' : ''} transition-transform`}
      >
        <div
          className={`flex items-center justify-center w-8 h-4 rounded-full cursor-grab active:cursor-grabbing ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          <GripHorizontal className="w-4 h-3" />
        </div>
        <div className="flex items-end gap-2">
          {items.map((item, index) => (
            <DockItemComponent
              key={item.href}
              item={item}
              isActive={index === activeIndex}
              mouseX={mouseX}
              isDark={isDark}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dock;
