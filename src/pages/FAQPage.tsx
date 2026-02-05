import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FAQItem {
  id: string;
}

const FAQPage: React.FC = () => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const toggleItem = (index: number) => {
    if (openItems.includes(index)) {
      setOpenItems(openItems.filter(i => i !== index));
    } else {
      setOpenItems([...openItems, index]);
    }
  };

  const faqIds: FAQItem[] = [
    { id: 'q1' },
    { id: 'q2' },
    { id: 'q3' },
    { id: 'q4' },
    { id: 'q5' },
    { id: 'q6' },
    { id: 'q7' },
    { id: 'q8' },
    { id: 'q9' },
    { id: 'q10' },
    { id: 'q11' }
  ];

  const renderAnswer = (faqId: string) => {
    const answerKey = `faqPage.questions.${faqId}.answer`;

    switch (faqId) {
      case 'q1':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ol className="list-decimal ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.step1`)}</li>
              <li>{t(`${answerKey}.step2`)}</li>
              <li>{t(`${answerKey}.step3`)}</li>
              <li>{t(`${answerKey}.step4`)}</li>
            </ol>
            <p className="mt-2">{t(`${answerKey}.outro`)}</p>
          </>
        );
      case 'q2':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li><strong>{t(`${answerKey}.createTeam`)}</strong> {t(`${answerKey}.createTeamDesc`)}</li>
              <li><strong>{t(`${answerKey}.joinTeam`)}</strong> {t(`${answerKey}.joinTeamDesc`)}</li>
            </ul>
            <p className="mt-2">{t(`${answerKey}.outro`)}</p>
          </>
        );
      case 'q3':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.requirement1`)}</li>
              <li>{t(`${answerKey}.requirement2`)}</li>
              <li>{t(`${answerKey}.requirement3`)}</li>
            </ul>
            <p className="mt-2">{t(`${answerKey}.outro`)}</p>
          </>
        );
      case 'q4':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li><strong>{t(`${answerKey}.onlineTournaments`)}</strong> {t(`${answerKey}.onlineTournamentsDesc`)}</li>
              <li><strong>{t(`${answerKey}.physicalTournaments`)}</strong> {t(`${answerKey}.physicalTournamentsDesc`)}</li>
            </ul>
            <p className="mt-2">{t(`${answerKey}.requirement`)}</p>
            <p className="mt-1">{t(`${answerKey}.note`)}</p>
          </>
        );
      case 'q5':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.option1`)}</li>
              <li>{t(`${answerKey}.option2`)}</li>
              <li>{t(`${answerKey}.option3`)}</li>
            </ul>
            <p className="mt-2">{t(`${answerKey}.outro`)}</p>
          </>
        );
      case 'q6':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ol className="list-decimal ml-5 space-y-2 mt-2">
              <li><strong>{t(`${answerKey}.phase1`)}</strong> {t(`${answerKey}.phase1Desc`)}</li>
              <li><strong>{t(`${answerKey}.phase2`)}</strong> {t(`${answerKey}.phase2Desc`)}</li>
              <li><strong>{t(`${answerKey}.phase3`)}</strong> {t(`${answerKey}.phase3Desc`)}</li>
            </ol>
            <p className="mt-2">{t(`${answerKey}.notification`)}</p>
            <p className="mt-1">{t(`${answerKey}.support`)}</p>
          </>
        );
      case 'q7':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ol className="list-decimal ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.step1`)}</li>
              <li>{t(`${answerKey}.step2`)}</li>
              <li>{t(`${answerKey}.step3`)}</li>
            </ol>
            <p className="mt-2">{t(`${answerKey}.decision`)}</p>
            <p className="mt-1">{t(`${answerKey}.warning`)}</p>
          </>
        );
      case 'q8':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.requirement1`)}</li>
              <li>{t(`${answerKey}.requirement2`)}</li>
              <li>{t(`${answerKey}.requirement3`)}</li>
              <li>{t(`${answerKey}.requirement4`)}</li>
            </ul>
            <p className="mt-2">{t(`${answerKey}.resources`)}</p>
          </>
        );
      case 'q9':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ol className="list-decimal ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.step1`)}</li>
              <li>{t(`${answerKey}.step2`)}</li>
              <li>{t(`${answerKey}.step3`)}</li>
            </ol>
            <p className="mt-2">{t(`${answerKey}.behaviors`)}</p>
            <p className="mt-1">{t(`${answerKey}.sanctions`)}</p>
          </>
        );
      case 'q10':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.free`)}</li>
              <li>{t(`${answerKey}.paid`)}</li>
              <li>{t(`${answerKey}.team`)}</li>
            </ul>
            <p className="mt-2">{t(`${answerKey}.howTo`)}</p>
            <p className="mt-1">{t(`${answerKey}.warning`)}</p>
          </>
        );
      case 'q11':
        return (
          <>
            <p>{t(`${answerKey}.intro`)}</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li><strong>{t(`${answerKey}.reason1`)}</strong> {t(`${answerKey}.reason1Desc`)}</li>
              <li><strong>{t(`${answerKey}.reason2`)}</strong> {t(`${answerKey}.reason2Desc`)}</li>
              <li><strong>{t(`${answerKey}.reason3`)}</strong> {t(`${answerKey}.reason3Desc`)}</li>
              <li><strong>{t(`${answerKey}.reason4`)}</strong> {t(`${answerKey}.reason4Desc`)}</li>
            </ul>
            <p className="mt-2"><strong>{t(`${answerKey}.howToTitle`)}</strong></p>
            <ol className="list-decimal ml-5 space-y-2 mt-2">
              <li>{t(`${answerKey}.howToStep1`)}</li>
              <li>{t(`${answerKey}.howToStep2`)}</li>
              <li>{t(`${answerKey}.howToStep3`)}</li>
              <li>{t(`${answerKey}.howToStep4`)}</li>
              <li>{t(`${answerKey}.howToStep5`)}</li>
            </ol>
            <p className="mt-2">{t(`${answerKey}.note`)}</p>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen pt-28 pb-16 bg-gray-50 dark:bg-dark-200">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl mb-4">
              {t('faqPage.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('faqPage.subtitle')}
            </p>
          </div>

          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800">
            {faqIds.map((faq, index) => (
              <div key={index} className="overflow-hidden">
                <button
                  className="flex justify-between items-center w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 dark:hover:bg-dark-200/50 transition-colors"
                  onClick={() => toggleItem(index)}
                >
                  <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                    {t(`faqPage.questions.${faq.id}.question`)}
                  </h3>
                  <span>
                    {openItems.includes(index) ? (
                      <ChevronUp className="h-5 w-5 text-primary-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-primary-500" />
                    )}
                  </span>
                </button>
                <div
                  className={`px-6 pb-4 text-gray-300 transition-all duration-300 ${
                    openItems.includes(index)
                      ? 'max-h-[500px] opacity-100'
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <div className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    {renderAnswer(faq.id)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('faqPage.notFound')}
            </p>
            <div className="flex justify-center">
              <a
                href="/contact"
                className="btn btn-primary"
              >
                {t('faqPage.contactTeam')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;