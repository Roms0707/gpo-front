import { useRef, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';

interface DockItem {
  icon: ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface DockProps {
  items: DockItem[];
  className?: string;
}

interface DockIconProps {
  mouseX: MotionValue<number>;
  item: DockItem;
  isActive: boolean;
}

const DockIcon: React.FC<DockIconProps> = ({ mouseX, item, isActive }) => {
  const ref = useRef<HTMLAnchorElement>(null);

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

  return (
    <Link to={item.path} className="relative flex flex-col items-center">
      <motion.div
        ref={ref as unknown as React.RefObject<HTMLDivElement>}
        style={{ width, height: width }}
        className={`
          flex items-center justify-center rounded-xl
          transition-colors duration-200
          ${isActive
            ? 'bg-primary-500/20 text-primary-500'
            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          }
        `}
      >
        <motion.div
          style={{
            width: useTransform(width, (w) => w * 0.5),
            height: useTransform(width, (w) => w * 0.5),
          }}
          className="flex items-center justify-center"
        >
          {item.icon}
        </motion.div>
        {item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </motion.div>
      <motion.span
        className={`
          mt-1 text-xs font-medium transition-colors duration-200
          ${isActive ? 'text-primary-400' : 'text-white/60'}
        `}
        style={{
          fontSize: useTransform(width, [48, 64], [10, 12]),
        }}
      >
        {item.label}
      </motion.span>
      {isActive && (
        <motion.div
          layoutId="dock-indicator"
          className="absolute -bottom-1 w-1 h-1 bg-primary-500 rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
};

const Dock: React.FC<DockProps> = ({ items, className = '' }) => {
  const location = useLocation();
  const mouseX = useMotionValue(Infinity);

  const getIsActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) mouseX.set(touch.pageX);
      }}
      onTouchEnd={() => mouseX.set(Infinity)}
      className={`
        fixed bottom-0 left-0 right-0 z-50 md:hidden
        bg-dark-100/80 backdrop-blur-xl
        border-t border-white/10
        px-4 pb-safe pt-2
        ${className}
      `}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-end justify-around max-w-md mx-auto">
        {items.map((item) => (
          <DockIcon
            key={item.path}
            mouseX={mouseX}
            item={item}
            isActive={getIsActive(item.path)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default Dock;
