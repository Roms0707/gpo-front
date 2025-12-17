import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-dark-200 rounded-2xl p-8 max-w-md w-full border border-gray-700/50 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                {t('store.congratulations')}
              </h2>

              <p className="text-gray-400 mb-8">
                {t('store.purchaseSuccessMessage')}
              </p>

              <button
                onClick={onClose}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {t('store.close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseSuccessModal;
