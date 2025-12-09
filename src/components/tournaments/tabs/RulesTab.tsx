import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Loader, AlertTriangle } from 'lucide-react';
import { Tournament } from '../../../types';
import { supabase } from '../../../lib/supabase';

interface RulesTabProps {
  tournament: Tournament;
  gameName: string;
}

const RulesTab: React.FC<RulesTabProps> = ({
  tournament,
  gameName
}) => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTournamentRules = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch tournament rules from the database
        const { data, error } = await supabase
          .from('tournaments')
          .select('rules')
          .eq('id', tournament.id)
          .single();
        
        if (error) {
          console.error('Error loading tournament rules:', error);
          throw new Error(t('rulesTab.loadError'));
        }
        
        setRules(data.rules);
      } catch (err) {
        console.error('Error loading tournament rules:', err);
        setError(t('rulesTab.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTournamentRules();
  }, [tournament.id, t]);

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-800" role="tabpanel" id="rules-panel" aria-labelledby="rules-tab">
      <h2 className="font-heading font-bold text-xl sm:text-2xl mb-4 sm:mb-6 flex items-center text-gray-900 dark:text-white">
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-accent-600 dark:text-accent-500 mr-2" aria-hidden="true" />
        <span className="hidden sm:inline">{t('rulesTab.title', { title: tournament?.title })}</span>
        <span className="sm:hidden">{t('rulesTab.titleShort')}</span>
      </h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin text-accent-600 dark:text-accent-500" aria-hidden="true" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">{t('rulesTab.loading')}</span>
        </div>
      ) : error ? (
        <div className="bg-error-500/20 border border-error-600 text-white px-4 py-3 rounded" role="alert">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-error-400 mr-2" aria-hidden="true" />
            <span>{error}</span>
          </div>
        </div>
      ) : rules ? (
        <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
          <div
            className="bg-gray-50 dark:bg-dark-200/50 p-4 sm:p-5 md:p-6 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: rules }}
          />
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('rulesTab.noRules')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {t('rulesTab.contactOrganizers')}
          </p>
        </div>
      )}
      
      {/* General Rules Section */}
      {!rules && (
        <div className="mt-6 sm:mt-8 bg-gray-50 dark:bg-dark-200 p-4 sm:p-5 md:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-heading font-semibold text-lg sm:text-xl mb-3 sm:mb-4 text-gray-900 dark:text-white">{t('rulesTab.generalRulesTitle')}</h3>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="font-medium text-accent-600 dark:text-accent-400 mb-2 text-sm sm:text-base">{t('rulesTab.eligibility.title')}</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li>{t('rulesTab.eligibility.minAge')}</li>
                <li>{t('rulesTab.eligibility.eligibleCountry')}</li>
                <li>{t('rulesTab.eligibility.legalCopy')}</li>
                <li>{t('rulesTab.eligibility.staffRestriction')}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-accent-600 dark:text-accent-400 mb-2">{t('rulesTab.formatSchedule.title')}</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>{t('rulesTab.formatSchedule.punctuality')}</li>
                <li>{t('rulesTab.formatSchedule.lateDisqualification')}</li>
                <li>{t('rulesTab.formatSchedule.tournamentFormat', { format: tournament.format })}</li>
                <li>{t('rulesTab.formatSchedule.scheduleNotification')}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-accent-600 dark:text-accent-400 mb-2">{t('rulesTab.behavior.title')}</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>{t('rulesTab.behavior.fairPlay')}</li>
                <li>{t('rulesTab.behavior.cheating')}</li>
                <li>{t('rulesTab.behavior.harassment')}</li>
                <li>{t('rulesTab.behavior.adminDecisions')}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-accent-600 dark:text-accent-400 mb-2">{t('rulesTab.equipment.title')}</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>{t('rulesTab.equipment.responsibility')}</li>
                <li>{t('rulesTab.equipment.technicalIssues')}</li>
                <li>{t('rulesTab.equipment.serverIssues')}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-accent-600 dark:text-accent-400 mb-2">{t('rulesTab.broadcasting.title')}</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>{t('rulesTab.broadcasting.officialBroadcast')}</li>
                <li>{t('rulesTab.broadcasting.personalBroadcast')}</li>
                <li>{t('rulesTab.broadcasting.promotionalRights')}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg">
            <p className="text-accent-800 dark:text-accent-200 text-sm">
              <strong>{t('rulesTab.noteTitle')}</strong> {t('rulesTab.noteText')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesTab;