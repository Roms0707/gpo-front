import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface SteamAccountIntegrationProps {
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

const SteamAccountIntegration: React.FC<SteamAccountIntegrationProps> = ({
  initialValue = '',
  initialValidated = false,
  initialValidationData = null,
  onDataChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [steamId64, setSteamId64] = useState(initialValue);
  const [isValidated, setIsValidated] = useState(initialValidated);
  const [validationData, setValidationData] = useState(initialValidationData);
  const [isValidating, setIsValidating] = useState(false);

  // Update parent when data changes
  useEffect(() => {
    onDataChange({
      value: steamId64,
      isValidated,
      validationData
    });
  }, [steamId64, isValidated, validationData, onDataChange]);

  const validateSteamId64 = async () => {
    if (!steamId64 || steamId64.length !== 17 || !/^\d{17}$/.test(steamId64)) {
      toast.error(t('gaming.steamId64MustBe17Digits'));
      return;
    }
    
    try {
      setIsValidating(true);
      
      // Call the Steam profile Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-steam-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          steamId64: steamId64,
          includeBans: false,
          includeGames: false
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.profile) {
        setIsValidated(true);
        setValidationData(result.profile);
        toast.success(t('gaming.steamAccountValidated', { name: result.profile.personaname }));
      } else {
        setIsValidated(false);
        setValidationData(null);
        toast.error(result.error || t('gaming.errorValidatingSteamAccount'));
      }
    } catch (error) {
      console.error('Error validating Steam ID:', error);
      setIsValidated(false);
      setValidationData(null);
      toast.error(t('gaming.errorValidatingSteamAccount'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSteamId64(value);
    if (isValidated) {
      setIsValidated(false);
      setValidationData(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="steamId64" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('gaming.steamId64')}
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="steamId64"
            value={steamId64}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`flex-1 bg-white dark:bg-dark-300 border ${isValidated ? 'border-success-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
            placeholder={t('gaming.steamId64Placeholder')}
            pattern="[0-9]{17}"
            title={t('gaming.steamId64MustBe17DigitsTitle')}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={validateSteamId64}
            disabled={isValidating || !steamId64 || steamId64.length !== 17 || disabled}
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
          {t('gaming.steamId64Helper')}
        </p>
        {isValidated && validationData && (
          <div className="mt-2 p-2 bg-success-500/10 border border-success-500/30 rounded-lg">
            <div className="flex items-center text-success-400 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>{t('gaming.accountValidatedName', { name: validationData.personaname })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SteamAccountIntegration;