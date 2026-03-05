import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface RadialMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  isActive: boolean;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
  isOpen: boolean;
  onClose: () => void;
}

const RADIUS = 120;
const START_ANGLE = -155;
const END_ANGLE = -25;

function getItemPosition(index: number, total: number) {
  const angleRange = END_ANGLE - START_ANGLE;
  const angleStep = angleRange / (total - 1);
  const angle = START_ANGLE + angleStep * index;
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * RADIUS,
    y: Math.sin(rad) * RADIUS,
  };
}

const RadialMenu: React.FC<RadialMenuProps> = ({ items, isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </motion.div>

          <div
            className="fixed z-50 md:hidden pointer-events-none"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {items.map((item, index) => {
              const pos = getItemPosition(index, items.length);
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.href + item.label}
                  className="absolute pointer-events-auto"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: '-50%', y: '-50%', scale: 0, opacity: 0 }}
                  animate={{
                    x: `calc(-50% + ${pos.x}px)`,
                    y: `calc(-50% + ${pos.y}px)`,
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{ x: '-50%', y: '-50%', scale: 0, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                >
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-90 ${
                        item.isActive
                          ? 'shadow-lg'
                          : 'shadow-lg'
                      }`}
                      style={{
                        background: item.isActive
                          ? undefined
                          : isDark
                          ? 'rgba(30, 30, 40, 0.85)'
                          : 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: item.isActive
                          ? '0 8px 24px rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
                          : isDark
                          ? '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06)'
                          : '0 8px 24px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.8)',
                      }}
                    >
                      {item.isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600" />
                      )}
                      <div
                        className={`absolute inset-0 rounded-2xl border ${
                          item.isActive
                            ? 'border-white/25'
                            : isDark
                            ? 'border-white/10'
                            : 'border-white/60'
                        }`}
                      />
                      {!item.isActive && (
                        <div
                          className={`absolute inset-0 rounded-2xl ${
                            isDark
                              ? 'bg-gradient-to-br from-white/8 via-transparent to-black/10'
                              : 'bg-gradient-to-br from-white/60 via-transparent to-black/5'
                          }`}
                        />
                      )}
                      <Icon
                        className={`w-5.5 h-5.5 relative z-10 ${
                          item.isActive
                            ? 'text-white'
                            : isDark
                            ? 'text-gray-100'
                            : 'text-gray-700'
                        }`}
                        style={{ width: '22px', height: '22px' }}
                        strokeWidth={item.isActive ? 2.5 : 2}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-semibold leading-none px-2.5 py-1 rounded-lg whitespace-nowrap ${
                        item.isActive
                          ? 'text-primary-300 bg-primary-500/20 border border-primary-400/20'
                          : isDark
                          ? 'text-gray-200 bg-gray-900/80 border border-white/5'
                          : 'text-gray-700 bg-white/80 border border-gray-200/50'
                      }`}
                      style={{
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RadialMenu;
