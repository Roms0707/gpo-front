import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sword, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingPage } from '../../constants/onboardingSteps';

interface WelcomeStepProps {
  onStart: () => void;
  onSkip: () => void;
  pageName?: OnboardingPage;
}

const GOLD_COLOR = '#C8AA6E';
const GOLD_DARK = '#A68B4B';
const GOLD_LIGHT = '#F0E6D2';

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStart, onSkip, pageName = 'home' }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const username = user?.username || t('onboarding.defaultUser');

  const getTitleKey = () => {
    switch (pageName) {
      case 'gameHub':
        return 'onboarding.gameHub.welcome';
      case 'tournament':
        return 'onboarding.tournament.welcome';
      case 'gamingStats':
        return 'onboarding.gamingStats.welcome';
      default:
        return 'onboarding.home.welcome';
    }
  };

  const getDescriptionKey = () => {
    switch (pageName) {
      case 'gameHub':
        return 'onboarding.gameHub.welcomeMessage';
      case 'tournament':
        return 'onboarding.tournament.welcomeMessage';
      case 'gamingStats':
        return 'onboarding.gamingStats.welcomeMessage';
      default:
        return 'onboarding.home.welcomeMessage';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onSkip}
      />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 50%, #1a1a2e 100%)',
          clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)',
          boxShadow: `0 0 40px rgba(200, 170, 110, 0.3), 0 0 80px rgba(200, 170, 110, 0.15)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top center, ${GOLD_COLOR}15 0%, transparent 60%)`,
          }}
        />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={GOLD_COLOR} stopOpacity="0.8" />
              <stop offset="50%" stopColor={GOLD_DARK} stopOpacity="0.4" />
              <stop offset="100%" stopColor={GOLD_COLOR} stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <polygon
            points="20,0 calc(100% - 20),0 100%,20 100%,calc(100% - 20) calc(100% - 20),100% 20,100% 0,calc(100% - 20) 0,20"
            fill="none"
            stroke="url(#borderGradient)"
            strokeWidth="2"
            style={{ width: '100%', height: '100%' }}
          />
        </svg>

        <div
          className="absolute top-0 left-0 w-6 h-6"
          style={{
            borderTop: `3px solid ${GOLD_COLOR}`,
            borderLeft: `3px solid ${GOLD_COLOR}`,
            boxShadow: `0 0 10px ${GOLD_COLOR}`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-6 h-6"
          style={{
            borderTop: `3px solid ${GOLD_COLOR}`,
            borderRight: `3px solid ${GOLD_COLOR}`,
            boxShadow: `0 0 10px ${GOLD_COLOR}`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-6 h-6"
          style={{
            borderBottom: `3px solid ${GOLD_COLOR}`,
            borderLeft: `3px solid ${GOLD_COLOR}`,
            boxShadow: `0 0 10px ${GOLD_COLOR}`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-6 h-6"
          style={{
            borderBottom: `3px solid ${GOLD_COLOR}`,
            borderRight: `3px solid ${GOLD_COLOR}`,
            boxShadow: `0 0 10px ${GOLD_COLOR}`,
          }}
        />

        <motion.div
          className="absolute top-0 left-0 w-full h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD_COLOR}, transparent)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <button
          onClick={onSkip}
          className="absolute top-5 right-5 p-2 transition-all duration-200 z-10 group"
          style={{ color: GOLD_COLOR }}
          aria-label={t('onboarding.skip')}
        >
          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <div className="relative p-8 pt-10 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6"
            style={{
              background: `linear-gradient(135deg, ${GOLD_COLOR}25 0%, ${GOLD_DARK}35 100%)`,
              border: `3px solid ${GOLD_COLOR}`,
              clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
              boxShadow: `0 0 30px ${GOLD_COLOR}40, inset 0 0 20px ${GOLD_COLOR}20`,
            }}
          >
            <Sword className="w-10 h-10" style={{ color: GOLD_COLOR }} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-3 tracking-wide"
            style={{
              color: GOLD_LIGHT,
              textShadow: `0 0 20px ${GOLD_COLOR}50`,
              fontFamily: "'Rajdhani', 'Orbitron', sans-serif",
            }}
          >
            {t(getTitleKey(), { username })}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 leading-relaxed text-base"
            style={{ color: '#a0a0b0' }}
          >
            {t(getDescriptionKey())}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <motion.button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 font-bold text-base tracking-wide transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, ${GOLD_COLOR} 0%, ${GOLD_DARK} 100%)`,
                color: '#0f0f1a',
                clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                boxShadow: `0 0 25px ${GOLD_COLOR}50`,
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: `0 0 35px ${GOLD_COLOR}70`,
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{t('onboarding.letsStart')}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <button
              onClick={onSkip}
              className="w-full px-6 py-3 font-medium transition-all duration-200"
              style={{
                color: GOLD_COLOR,
                border: `1px solid ${GOLD_COLOR}30`,
                background: 'transparent',
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${GOLD_COLOR}10`;
                e.currentTarget.style.borderColor = `${GOLD_COLOR}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = `${GOLD_COLOR}30`;
              }}
            >
              {t('onboarding.skip')}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeStep;
