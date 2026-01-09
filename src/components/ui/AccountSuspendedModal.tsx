import React from 'react';
import { X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AccountSuspendedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSuspendedModal: React.FC<AccountSuspendedModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
            {t('subscription.suspendedTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-500/20 rounded-full mb-4">
            <Smartphone className="h-10 w-10 text-warning-500" />
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {t('subscription.suspendedMessage')}
          </p>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            {t('subscription.tryAgain')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSuspendedModal;
