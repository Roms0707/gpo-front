import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Package, Award, X, ZoomIn } from 'lucide-react';
import { PhysicalDigitalPrize } from '../../../types';
import ExpandableText from '../../ui/ExpandableText';

interface PhysicalDigitalGalleryProps {
  prizes: PhysicalDigitalPrize[];
}

const PhysicalDigitalGallery: React.FC<PhysicalDigitalGalleryProps> = ({ prizes }) => {
  const { t } = useTranslation();
  const [selectedPrize, setSelectedPrize] = useState<PhysicalDigitalPrize | null>(null);

  const getPrizeIcon = (position: number) => {
    if (position === 1) return <Award className="h-full w-full" />;
    if (position <= 3) return <Gift className="h-full w-full" />;
    return <Package className="h-full w-full" />;
  };

  const getPositionLabel = (position: number) => {
    if (position === 1) return t('physicalDigitalGallery.firstPlace');
    if (position === 2) return t('physicalDigitalGallery.secondPlace');
    if (position === 3) return t('physicalDigitalGallery.thirdPlace');
    return t('physicalDigitalGallery.position', { position });
  };

  const getPositionBadgeColor = (position: number) => {
    if (position === 1) return 'from-yellow-400 to-yellow-600 border-yellow-400';
    if (position === 2) return 'from-gray-400 to-gray-600 border-gray-400';
    if (position === 3) return 'from-amber-600 to-amber-800 border-amber-600';
    return 'from-orange-500 to-orange-600 border-orange-500';
  };

  const topThreePrizes = prizes.filter(p => p.position <= 3).sort((a, b) => a.position - b.position);
  const remainingPrizes = prizes.filter(p => p.position > 3).sort((a, b) => a.position - b.position);

  return (
    <>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/40 rounded-full mb-4">
            <Gift className="h-5 w-5 text-orange-400" />
            <span className="font-heading font-bold text-sm uppercase tracking-wider text-orange-300">
              {t('physicalDigitalGallery.title')}
            </span>
          </div>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            {t('physicalDigitalGallery.description')}
          </p>
        </div>

        {topThreePrizes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topThreePrizes.map((prize, index) => (
              <div
                key={prize.id}
                className="group relative transform transition-all duration-500 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500/40 hover:border-orange-500 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className={`absolute top-3 right-3 px-3 py-1 bg-gradient-to-r ${getPositionBadgeColor(prize.position)} rounded-full border-2 shadow-lg z-10`}>
                    <span className="font-bold text-white text-xs uppercase">{getPositionLabel(prize.position)}</span>
                  </div>

                  {prize.image_url ? (
                    <div className="relative h-48 bg-gray-800/50 overflow-hidden">
                      <img
                        src={prize.image_url}
                        alt={prize.prize_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                      <button
                        onClick={() => setSelectedPrize(prize)}
                        className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full border border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        aria-label={t('physicalDigitalGallery.viewFullSize')}
                      >
                        <ZoomIn className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-orange-900/20 to-black/40 flex items-center justify-center">
                      <div className="w-24 h-24 text-orange-500/40 group-hover:text-orange-500/60 transition-colors">
                        {getPrizeIcon(prize.position)}
                      </div>
                    </div>
                  )}

                  <div className="p-5 relative z-10">
                    <h4 className="font-heading font-bold text-lg text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                      {prize.title}
                    </h4>
                    <div className="mb-4">
                      <ExpandableText
                        text={prize.prize_name}
                        maxLines={3}
                        className="text-gray-400 text-sm"
                        showGradient={false}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-400" />
                        <span className="text-xs text-orange-300 font-medium">{t('physicalDigitalGallery.physicalReward')}</span>
                      </div>
                      {prize.image_url && (
                        <button
                          onClick={() => setSelectedPrize(prize)}
                          className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
                        >
                          {t('physicalDigitalGallery.seeMore')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {remainingPrizes.length > 0 && (
          <div>
            <h3 className="font-heading font-bold text-xl mb-6 text-center text-gray-900 dark:text-white uppercase tracking-wide">
              {t('physicalDigitalGallery.otherRewards')}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {remainingPrizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="group relative transform transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/30 hover:border-orange-500 rounded-lg overflow-hidden transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500/30 rounded-full border border-orange-400/50 z-10">
                      <span className="font-bold text-orange-300 text-xs">{t('physicalDigitalGallery.positionShort', { position: prize.position })}</span>
                    </div>

                    {prize.image_url ? (
                      <div className="relative h-32 bg-gray-800/50">
                        <img
                          src={prize.image_url}
                          alt={prize.prize_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-40"></div>
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-orange-900/10 to-black/20 flex items-center justify-center">
                        <div className="w-16 h-16 text-orange-500/30">
                          {getPrizeIcon(prize.position)}
                        </div>
                      </div>
                    )}

                    <div className="p-3 relative z-10">
                      <h5 className="font-bold text-sm text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                        {prize.title}
                      </h5>
                      <ExpandableText
                        text={prize.prize_name}
                        maxLines={2}
                        className="text-xs text-gray-400"
                        showGradient={false}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedPrize && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPrize(null)}
        >
          <div
            className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-orange-500 rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPrize(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full border border-white/20 transition-all duration-300 z-20"
              aria-label={t('physicalDigitalGallery.close')}
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <div className={`absolute top-6 left-6 px-4 py-2 bg-gradient-to-r ${getPositionBadgeColor(selectedPrize.position)} rounded-full border-2 shadow-lg z-10`}>
              <span className="font-bold text-white text-sm uppercase">{getPositionLabel(selectedPrize.position)}</span>
            </div>

            {selectedPrize.image_url && (
              <div className="relative h-80 bg-gray-800/50">
                <img
                  src={selectedPrize.image_url}
                  alt={selectedPrize.prize_name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
              </div>
            )}

            <div className="p-8">
              <h3 className="font-heading font-bold text-2xl text-white mb-3">
                {selectedPrize.title}
              </h3>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                {selectedPrize.prize_name}
              </p>
              <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <Package className="h-6 w-6 text-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-orange-300 font-medium text-sm">{t('physicalDigitalGallery.physicalDigitalReward')}</p>
                  <p className="text-gray-400 text-xs">{t('physicalDigitalGallery.rewardWillBeGiven', { position: selectedPrize.position })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhysicalDigitalGallery;
