import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
  label: string;
  path: string;
}

interface PillNavProps {
  items: NavItem[];
  className?: string;
  textClassName?: string;
  activeTextClassName?: string;
  indicatorClassName?: string;
}

const PillNav: React.FC<PillNavProps> = ({
  items,
  className = '',
  textClassName = 'text-gray-700 dark:text-gray-300',
  activeTextClassName = 'text-gray-900 dark:text-white',
  indicatorClassName = 'bg-primary-500',
}) => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const currentIndex = items.findIndex(item => {
      if (item.path === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.path);
    });
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, items]);

  useEffect(() => {
    const activeElement = itemRefs.current[activeIndex];
    if (activeElement && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - navRect.left,
        width: activeRect.width,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const handleResize = () => {
      const activeElement = itemRefs.current[activeIndex];
      if (activeElement && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - navRect.left,
          width: activeRect.width,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  return (
    <nav
      ref={navRef}
      className={`relative flex items-center gap-1 ${className}`}
    >
      <motion.div
        className={`absolute bottom-0 h-0.5 ${indicatorClassName}`}
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {items.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <Link
            key={item.path}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            to={item.path}
            className={`
              relative px-4 py-2 text-sm font-medium transition-colors duration-200
              ${isActive ? activeTextClassName : textClassName}
              hover:${activeTextClassName}
            `}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default PillNav;
