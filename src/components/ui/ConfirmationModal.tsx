import React from 'react';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  isLoading = false
}) => {
  if (!isOpen) return null;

  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Get styling based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <XCircle className="h-12 w-12 text-error-500" />,
          iconBg: 'bg-error-500/20',
          confirmButton: 'bg-error-600 hover:bg-error-700 disabled:bg-error-600/50'
        };
      case 'info':
        return {
          icon: <CheckCircle className="h-12 w-12 text-info-500" />,
          iconBg: 'bg-info-500/20',
          confirmButton: 'bg-info-600 hover:bg-info-700 disabled:bg-info-600/50'
        };
      default: // warning
        return {
          icon: <AlertTriangle className="h-12 w-12 text-warning-500" />,
          iconBg: 'bg-warning-500/20',
          confirmButton: 'bg-warning-600 hover:bg-warning-700 disabled:bg-warning-600/50'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label="Fermer"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${typeStyles.iconBg} rounded-full mb-4`}>
            {typeStyles.icon}
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-white rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 ${typeStyles.confirmButton} disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Traitement...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;