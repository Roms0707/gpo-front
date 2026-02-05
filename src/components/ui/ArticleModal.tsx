import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  imageUrl?: string;
}

const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  imageUrl
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Prevent clicks inside the modal from closing it
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-dark-100 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white pr-8">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors flex-shrink-0"
            aria-label={t('common.close')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Article image if available */}
          {imageUrl && (
            <div className="w-full h-64 overflow-hidden">
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Article content */}
          <div className="p-6">
            <div 
              className="prose prose-gray dark:prose-invert prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;