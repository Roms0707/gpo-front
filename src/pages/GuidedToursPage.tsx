import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Map } from 'lucide-react';
import GuidedToursSection from '../components/profile/GuidedToursSection';

const GuidedToursPage: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/profile"
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('profile.backToProfile')}
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Map className="h-6 w-6 text-amber-500" />
              </div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">
                {t('onboarding.guidedTours.title')}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 ml-14">
              {t('onboarding.guidedTours.pageDescription', 'Explore the platform features with interactive guided tours. Replay any tour to refresh your memory.')}
            </p>
          </div>

          <GuidedToursSection />
        </div>
      </div>
    </div>
  );
};

export default GuidedToursPage;
