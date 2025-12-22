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
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid rgb(31, 41, 55)',
        };
      case 'bottom':
        return {
          ...baseStyles,
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgb(31, 41, 55)',
        };
      case 'left':
        return {
          ...baseStyles,
          left: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '8px solid rgb(31, 41, 55)',
        };
      case 'right':
        return {
          ...baseStyles,
          right: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '8px solid rgb(31, 41, 55)',
        };
      default:
        return baseStyles;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[10000] w-80"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="relative bg-gray-800 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
        <div style={getArrowStyles()} />

        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />

        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          aria-label={t('onboarding.skip')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            {Icon && (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">
                {t(step.titleKey)}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {t(step.descriptionKey)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps - 1 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep - 1
                      ? 'bg-primary-500'
                      : index < currentStep - 1
                      ? 'bg-primary-500/50'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirstFeatureStep && (
                <button
                  onClick={onPrevious}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('onboarding.previous')}</span>
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                <span>{isLastStep ? t('onboarding.finish') : t('onboarding.next')}</span>
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalkthroughTooltip;
