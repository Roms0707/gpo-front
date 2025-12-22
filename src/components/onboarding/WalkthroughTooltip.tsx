import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { OnboardingStep } from '../../constants/onboardingSteps';
import { TooltipPosition } from '../../utils/walkthroughUtils';

interface WalkthroughTooltipProps {
  step: OnboardingStep;
  position: TooltipPosition;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

const GOLD_COLOR = '#C8AA6E';
const GOLD_DARK = '#A68B4B';
const GOLD_LIGHT = '#F0E6D2';

const WalkthroughTooltip: React.FC<WalkthroughTooltipProps> = ({
  step,
  position,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}) => {
  const { t } = useTranslation();
  const Icon = step.icon;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstFeatureStep = currentStep === 1;

  const getArrowStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    switch (position.arrowPosition) {
      case 'top':
        return {
          ...baseStyles,
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderBottom: `10px solid ${GOLD_COLOR}`,
        };
      case 'bottom':
        return {
          ...baseStyles,
          bottom: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `10px solid ${GOLD_COLOR}`,
        };
      case 'left':
        return {
          ...baseStyles,
          left: -10,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
          borderRight: `10px solid ${GOLD_COLOR}`,
        };
      case 'right':
        return {
          ...baseStyles,
          right: -10,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
          borderLeft: `10px solid ${GOLD_COLOR}`,
        };
      default:
        return baseStyles;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed z-[10000] w-80"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 50%, #1a1a2e 100%)',
          clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
          boxShadow: `0 0 20px rgba(200, 170, 110, 0.3), inset 0 1px 0 rgba(200, 170, 110, 0.2)`,
        }}
      >
        <div style={getArrowStyles()} />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${GOLD_COLOR}15 0%, transparent 50%, ${GOLD_COLOR}10 100%)`,
          }}
        />

        <div
          className="absolute top-0 left-0 w-full h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD_COLOR}, transparent)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD_COLOR}, transparent)`,
          }}
        />
        <div
          className="absolute top-0 left-0 w-[2px] h-full"
          style={{
            background: `linear-gradient(180deg, transparent, ${GOLD_COLOR}, transparent)`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-[2px] h-full"
          style={{
            background: `linear-gradient(180deg, transparent, ${GOLD_COLOR}, transparent)`,
          }}
        />

        <div
          className="absolute top-0 left-0 w-4 h-4"
          style={{
            borderTop: `2px solid ${GOLD_COLOR}`,
            borderLeft: `2px solid ${GOLD_COLOR}`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4"
          style={{
            borderTop: `2px solid ${GOLD_COLOR}`,
            borderRight: `2px solid ${GOLD_COLOR}`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4"
          style={{
            borderBottom: `2px solid ${GOLD_COLOR}`,
            borderLeft: `2px solid ${GOLD_COLOR}`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4"
          style={{
            borderBottom: `2px solid ${GOLD_COLOR}`,
            borderRight: `2px solid ${GOLD_COLOR}`,
          }}
        />

        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1.5 rounded transition-all duration-200 z-10 group"
          style={{
            color: GOLD_COLOR,
          }}
          aria-label={t('onboarding.skip')}
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        <div className="p-5 pt-4">
          <div className="flex items-start gap-4 mb-4">
            {Icon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_COLOR}20 0%, ${GOLD_DARK}30 100%)`,
                  border: `2px solid ${GOLD_COLOR}`,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              >
                <Icon className="w-5 h-5" style={{ color: GOLD_COLOR }} />
              </motion.div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h3
                className="text-lg font-bold mb-1.5 tracking-wide"
                style={{
                  color: GOLD_LIGHT,
                  textShadow: `0 0 10px ${GOLD_COLOR}40`,
                  fontFamily: "'Rajdhani', 'Orbitron', sans-serif",
                }}
              >
                {t(step.titleKey)}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#a0a0b0' }}
              >
                {t(step.descriptionKey)}
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-between pt-3"
            style={{
              borderTop: `1px solid ${GOLD_COLOR}30`,
            }}
          >
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps - 1 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="transition-all duration-300"
                  style={{
                    width: 8,
                    height: 8,
                    background: index === currentStep - 1
                      ? GOLD_COLOR
                      : index < currentStep - 1
                      ? `${GOLD_COLOR}60`
                      : `${GOLD_COLOR}20`,
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    boxShadow: index === currentStep - 1 ? `0 0 8px ${GOLD_COLOR}` : 'none',
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirstFeatureStep && (
                <button
                  onClick={onPrevious}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm transition-all duration-200 rounded"
                  style={{
                    color: GOLD_COLOR,
                    border: `1px solid ${GOLD_COLOR}40`,
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${GOLD_COLOR}15`;
                    e.currentTarget.style.borderColor = GOLD_COLOR;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = `${GOLD_COLOR}40`;
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('onboarding.previous')}</span>
                </button>
              )}
              <motion.button
                onClick={onNext}
                className="flex items-center gap-1 px-4 py-1.5 text-sm font-semibold transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_COLOR} 0%, ${GOLD_DARK} 100%)`,
                  color: '#0f0f1a',
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  boxShadow: `0 0 15px ${GOLD_COLOR}40`,
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: `0 0 20px ${GOLD_COLOR}60`,
                }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{isLastStep ? t('onboarding.finish') : t('onboarding.next')}</span>
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalkthroughTooltip;
