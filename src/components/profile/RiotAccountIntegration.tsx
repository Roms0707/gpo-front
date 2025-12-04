import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader } from 'lucide-react';
import { validateRiotId } from '../../services/api';
import toast from 'react-hot-toast';

interface GamePublisherField {
  id: string;
  game_id: string;
  label: string;
  id_name: string;
  required: boolean;
  value?: string;
  isValidating?: boolean;
  isValidated?: boolean;
  validation_data?: any;
  validation_date?: string;
}

interface RiotAccountIntegrationProps {
  initialRiotFields: GamePublisherField[];
  onDataChange: (fields: GamePublisherField[]) => void;
  disabled?: boolean;
}

const RiotAccountIntegration: React.FC<RiotAccountIntegrationProps> = ({
  initialRiotFields,
  onDataChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [riotFields, setRiotFields] = useState<GamePublisherField[]>(initialRiotFields);
  const [localGameName, setLocalGameName] = useState('');
  const [localTagline, setLocalTagline] = useState('');

  // Initialize local state from initial fields
  useEffect(() => {
    const gameNameField = initialRiotFields.find(f => f.id_name.includes('game_name-riot'));
    const taglineField = initialRiotFields.find(f => f.id_name.includes('tagline-riot'));
    
    if (gameNameField) {
      setLocalGameName(gameNameField.value || '');
    }
    if (taglineField) {
      setLocalTagline(taglineField.value || '');
    }
    
    setRiotFields(initialRiotFields);
  }, [initialRiotFields]);

  // Update parent when fields change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onDataChange(riotFields);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [riotFields, onDataChange]);

  const handleGameNameChange = (value: string) => {
    setLocalGameName(value);
    
    setRiotFields(prev => 
      prev.map(field => 
        field.id_name.includes('game_name-riot') ? { ...field, value, isValidated: false } : field
      )
    );
  };

  const handleTaglineChange = (value: string) => {
    setLocalTagline(value);
    
    setRiotFields(prev => 
      prev.map(field => 
        field.id_name.includes('tagline-riot') ? { ...field, value, isValidated: false } : field
      )
    );
  };

  const validateRiotAccount = async () => {
    const gameNameField = riotFields.find(f => f.id_name.includes('game_name-riot'));
    const taglineField = riotFields.find(f => f.id_name.includes('tagline-riot'));
    
    if (!localGameName || !localTagline) {
      toast.error(t('gaming.fillGameNameAndTagline'));
      return;
    }

    try {
      // Set validating state for all fields
      setRiotFields(prev => 
        prev.map(f => ({ ...f, isValidating: true, isValidated: false }))
      );

      console.log('Validating Riot ID:', localGameName, localTagline);
      
      const result = await validateRiotId(localGameName, localTagline);
      
      if (result.valid) {
        // Set validated state for all fields
        setRiotFields(prev => 
          prev.map(f => ({ 
            ...f, 
            isValidating: false, 
            isValidated: true,
            validation_data: result,
            validation_date: new Date().toISOString()
          }))
        );
        
        toast.success(t('gaming.accountValidatedSuccess', { account: `${localGameName}#${localTagline}` }));
      } else {
        // Reset validation state for all fields
        setRiotFields(prev => 
          prev.map(f => ({ 
            ...f, 
            isValidating: false, 
            isValidated: false,
            validation_data: undefined,
            validation_date: undefined
          }))
        );
        
        toast.error(result.error || t('gaming.errorValidatingRiotAccount'));
      }
    } catch (error) {
      console.error('Error validating Riot account:', error);
      
      // Reset validation state for all fields
      setRiotFields(prev => 
        prev.map(f => ({ 
          ...f, 
          isValidating: false, 
          isValidated: false,
          validation_date: undefined
        }))
      );
      
      toast.error(t('gaming.errorValidatingAccount'));
    }
  };

  const gameNameField = riotFields.find(f => f.id_name.includes('game_name-riot'));
  const taglineField = riotFields.find(f => f.id_name.includes('tagline-riot'));

  if (!gameNameField || !taglineField) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-400">
          {t('gaming.riotIdConfigNotAvailable')}
        </p>
      </div>
    );
  }

  const isValidating = gameNameField.isValidating || taglineField.isValidating;
  const isValidated = gameNameField.isValidated || taglineField.isValidated;
  const bothFieldsHaveValues = localGameName && localTagline;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="riot_combined" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('gaming.riotId')}
        </label>
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              id="riot_game_name"
              value={localGameName}
              onChange={(e) => handleGameNameChange(e.target.value)}
              className="flex-1 bg-white dark:bg-dark-300 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('gaming.gameName')}
              disabled={disabled}
            />
            <div className="flex items-center px-2">
              <span className="text-gray-600 dark:text-gray-400">#</span>
            </div>
            <input
              type="text"
              id="riot_tagline"
              value={localTagline}
              onChange={(e) => handleTaglineChange(e.target.value)}
              className="w-1/3 bg-white dark:bg-dark-300 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('gaming.tagline')}
              disabled={disabled}
            />
          </div>
          
          {/* Validation button for Riot ID */}
          {bothFieldsHaveValues && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={validateRiotAccount}
                disabled={isValidating || isValidated || disabled}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center ${
                  isValidated
                    ? 'bg-success-600 text-white cursor-default' 
                    : isValidating
                      ? 'bg-primary-600/50 text-white cursor-wait'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
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
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('gaming.yourFullRiotId')}
        </p>
        {isValidated && gameNameField.validation_data && (
          <div className="mt-2 p-2 bg-success-500/10 border border-success-500/30 rounded-lg">
            <div className="flex items-center text-success-400 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>{t('gaming.accountValidatedName', { name: `${localGameName}#${localTagline}` })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiotAccountIntegration;