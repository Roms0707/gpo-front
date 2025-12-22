import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface WelcomeStepProps {
  onStart: () => void;
  onSkip: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStart, onSkip }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const username = user?.username || t('onboarding.defaultUser');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onSkip}
      />

      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/10" />

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />

        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors z-10"
          aria-label={t('onboarding.skip')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-6 shadow-lg shadow-primary-500/30"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-3"
          >
            {t('onboarding.welcome', { username })}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 mb-8 leading-relaxed"
          >
            {t('onboarding.welcomeMessage')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t('onboarding.letsStart')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onSkip}
              className="w-full px-6 py-3 text-gray-400 font-medium rounded-xl hover:text-white hover:bg-gray-700/30 transition-all duration-200"
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
