import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface FortniteAccountIntegrationProps {
  initialValue?: string;
  initialValidated?: boolean;
  initialValidationData?: any;
  onDataChange: (data: {
    value: string;
    isValidated: boolean;
    validationData: any;
  }) => void;
  disabled?: boolean;
}

const FortniteAccountIntegration: React.FC<FortniteAccountIntegrationProps> = ({
  initialValue = '',
  initialValidated = false,
  initialValidationData = null,
  onDataChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [epicId, setEpicId] = useState(initialValue);
  const [isValidated, setIsValidated] = useState(initialValidated);
  const [validationData, setValidationData] = useState(initialValidationData);
  const [isValidating, setIsValidating] = useState(false);

  // Update parent when data changes
  useEffect(() => {
    onDataChange({
      value: epicId,
      isValidated,
      validationData
    });
  }, [epicId, isValidated, validationData, onDataChange]);

  const validateFortniteAccount = async () => {
    if (!epicId.trim()) {
      toast.error(t('gaming.pleaseEnterEpicGamesUsername'));
      return;
    }
    
    try {
      setIsValidating(true);
      
      // Call the Fortnite stats Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-fortnite-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          playerIdentifier: epicId.trim(),
          platform: 'epic'
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setIsValidated(true);
        setValidationData(result.data);
        toast.success(t('gaming.fortniteAccountValidated', { username: epicId }));
      } else {
        setIsValidated(false);
        setValidationData(null);
        toast.error(result.error || t('gaming.errorValidatingFortniteAccount'));
      }
    } catch (error) {
      console.error('Error validating Fortnite account:', error);
      setIsValidated(false);
      setValidationData(null);
      toast.error(t('gaming.errorValidatingFortniteAccount'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEpicId(value);
    if (isValidated) {
      setIsValidated(false);
      setValidationData(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="fortniteEpicId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('gaming.epicGamesUsernameFortnite')}
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="fortniteEpicId"
            value={epicId}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`flex-1 bg-white dark:bg-dark-300 border ${isValidated ? 'border-success-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
            placeholder={t('gaming.yourEpicGamesUsername')}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={validateFortniteAccount}
            disabled={isValidating || !epicId.trim() || disabled}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center ${
              isValidated
                ? 'bg-success-600 text-white cursor-default' 
                : isValidating
                  ? 'bg-primary-600/50 text-white cursor-wait'
                  : 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {isValidating ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-1" />
                <span>{t('gaming.validating')}</span>
              </>
            ) : isValidated ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>{t('gaming.validated')}</span>
              </>
            ) : (
              <span>{t('gaming.validate')}</span>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('gaming.epicGamesUsernameCaseSensitive')}
        </p>
        {isValidated && validationData && (
          <div className="mt-2 p-2 bg-success-500/10 border border-success-500/30 rounded-lg">
            <div className="flex items-center text-success-400 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>{t('gaming.accountValidatedName', { name: validationData.account?.name || epicId })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FortniteAccountIntegration;