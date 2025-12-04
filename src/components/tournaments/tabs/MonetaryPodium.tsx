import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Award, Sparkles } from 'lucide-react';
import { MonetaryPrize } from '../../../types';
import { formatMonetaryPrize } from '../../../utils/prizePoolUtils';

interface MonetaryPodiumProps {
  prizes: MonetaryPrize[];
  totalPrizePool: number;
  currency: string;
}

const MonetaryPodium: React.FC<MonetaryPodiumProps> = ({ prizes, totalPrizePool, currency }) => {
  const { t } = useTranslation();

  const getPrizeIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-full w-full" />;
    if (position === 2) return <Medal className="h-full w-full" />;
    if (position === 3) return <Medal className="h-full w-full" />;
    return <Award className="h-full w-full" />;
  };

  const getPositionLabel = (position: number) => {
    if (position === 1) return t('monetaryPodium.firstPlace');
    if (position === 2) return t('monetaryPodium.secondPlace');
    if (position === 3) return t('monetaryPodium.thirdPlace');
    return t('monetaryPodium.position', { position });
  };

  const topThreePrizes = prizes.filter(p => p.position <= 3).sort((a, b) => a.position - b.position);
  const remainingPrizes = prizes.filter(p => p.position > 3).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border-4 border-orange-500 shadow-[0_0_30px_rgba(255,121,0,0.3)]"
           style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-transparent via-orange-500 to-transparent"></div>
          <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-transparent via-orange-500 to-transparent"></div>
        </div>

        <div className="relative px-8 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-orange-500 animate-pulse" aria-hidden="true" />
            <h3 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-wider text-orange-500"
                style={{ textShadow: '0 0 20px rgba(255,121,0,0.6), 0 0 40px rgba(255,121,0,0.3)' }}>
              {t('monetaryPodium.prizePoolTotal')}
            </h3>
            <Sparkles className="h-8 w-8 text-orange-500 animate-pulse" aria-hidden="true" />
          </div>
          <div className="font-heading font-black text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"
               style={{ textShadow: '0 0 30px rgba(255,121,0,0.5)' }}
               aria-label={t('monetaryPodium.totalPrizePool', { amount: formatMonetaryPrize(totalPrizePool, currency, false) })}>
            {formatMonetaryPrize(totalPrizePool, currency, false)}
          </div>
        </div>
      </div>

      {topThreePrizes.length > 0 && (
        <div className="relative py-12">
          <h3 className="font-heading font-bold text-xl mb-8 text-center text-gray-900 dark:text-white uppercase tracking-wide">
            {t('monetaryPodium.championsPodium')}
          </h3>

          <div className="flex items-end justify-center gap-4 md:gap-8 px-4">
            {topThreePrizes.find(p => p.position === 2) && (
              <div className="flex-1 max-w-[200px] group perspective-1000">
                <div className="relative transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                     aria-label={t('monetaryPodium.placeAmount', { place: t('monetaryPodium.secondPlace'), amount: formatMonetaryPrize(topThreePrizes.find(p => p.position === 2)!.monetary_amount, topThreePrizes.find(p => p.position === 2)!.currency, false) })}>
                  <div className="bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 border-2 border-orange-400/60 rounded-t-lg p-6 pb-16 relative overflow-hidden"
                       style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 100%, 0 100%, 0 10%)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg flex items-center justify-center border border-orange-400/40">
                      <span className="font-black text-orange-400 text-sm">{t('monetaryPodium.secondPlace')}</span>
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 mx-auto mb-3 text-orange-400/80">
                        {getPrizeIcon(2)}
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xl md:text-2xl text-orange-400 mb-1">
                          {formatMonetaryPrize(topThreePrizes.find(p => p.position === 2)!.monetary_amount, topThreePrizes.find(p => p.position === 2)!.currency, false)}
                        </div>
                        <div className="text-xs text-gray-300 uppercase tracking-wide">
                          {topThreePrizes.find(p => p.position === 2)!.title}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-16 bg-gradient-to-b from-orange-500/20 to-orange-600/20 border-x-2 border-b-2 border-orange-400/60"></div>
                </div>
              </div>
            )}

            {topThreePrizes.find(p => p.position === 1) && (
              <div className="flex-1 max-w-[220px] group perspective-1000">
                <div className="relative transform transition-all duration-500 hover:scale-110 hover:-translate-y-3"
                     aria-label={t('monetaryPodium.placeAmount', { place: t('monetaryPodium.firstPlace'), amount: formatMonetaryPrize(topThreePrizes.find(p => p.position === 1)!.monetary_amount, topThreePrizes.find(p => p.position === 1)!.currency, false) })}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 animate-bounce-slow">
                    <Sparkles className="w-full h-full text-orange-500" aria-hidden="true" />
                  </div>
                  <div className="bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700 border-4 border-orange-400 rounded-t-lg p-8 pb-24 relative overflow-hidden shadow-[0_0_40px_rgba(255,121,0,0.4)]"
                       style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 100%, 0 100%, 0 10%)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="absolute top-3 right-3 w-14 h-14 bg-gradient-to-br from-yellow-300/30 to-yellow-600/30 rounded-xl flex items-center justify-center border-2 border-yellow-400/60 shadow-lg">
                      <span className="font-black text-yellow-300 text-base">{t('monetaryPodium.firstPlace')}</span>
                    </div>
                    <div className="relative z-10">
                      <div className="w-20 h-20 mx-auto mb-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse-slow">
                        {getPrizeIcon(1)}
                      </div>
                      <div className="text-center">
                        <div className="font-black text-3xl md:text-4xl text-white mb-2"
                             style={{ textShadow: '0 0 20px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)' }}>
                          {formatMonetaryPrize(topThreePrizes.find(p => p.position === 1)!.monetary_amount, topThreePrizes.find(p => p.position === 1)!.currency, false)}
                        </div>
                        <div className="text-xs text-orange-100 uppercase tracking-wide font-semibold">
                          {topThreePrizes.find(p => p.position === 1)!.title}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24 bg-gradient-to-b from-orange-600/40 to-orange-700/40 border-x-4 border-b-4 border-orange-400"></div>
                </div>
              </div>
            )}

            {topThreePrizes.find(p => p.position === 3) && (
              <div className="flex-1 max-w-[200px] group perspective-1000">
                <div className="relative transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                     aria-label={t('monetaryPodium.placeAmount', { place: t('monetaryPodium.thirdPlace'), amount: formatMonetaryPrize(topThreePrizes.find(p => p.position === 3)!.monetary_amount, topThreePrizes.find(p => p.position === 3)!.currency, false) })}>
                  <div className="bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 border-2 border-orange-400/50 rounded-t-lg p-6 pb-12 relative overflow-hidden"
                       style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 100%, 0 100%, 0 10%)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg flex items-center justify-center border border-orange-400/40">
                      <span className="font-black text-orange-400 text-sm">{t('monetaryPodium.thirdPlace')}</span>
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 mx-auto mb-3 text-orange-400/70">
                        {getPrizeIcon(3)}
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xl md:text-2xl text-orange-400 mb-1">
                          {formatMonetaryPrize(topThreePrizes.find(p => p.position === 3)!.monetary_amount, topThreePrizes.find(p => p.position === 3)!.currency, false)}
                        </div>
                        <div className="text-xs text-gray-300 uppercase tracking-wide">
                          {topThreePrizes.find(p => p.position === 3)!.title}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-12 bg-gradient-to-b from-orange-500/15 to-orange-600/15 border-x-2 border-b-2 border-orange-400/50"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {remainingPrizes.length > 0 && (
        <div className="mt-12">
          <h3 className="font-heading font-bold text-xl mb-6 text-center text-gray-900 dark:text-white uppercase tracking-wide">
            {t('monetaryPodium.otherRewards')}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {remainingPrizes.map((prize, index) => (
              <div key={prize.id}
                   className="group relative transform transition-all duration-300 hover:scale-105"
                   style={{ animationDelay: `${index * 50}ms` }}
                   aria-label={t('monetaryPodium.positionAmount', { position: prize.position, amount: formatMonetaryPrize(prize.monetary_amount, prize.currency, false) })}>
                <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-orange-500/40 hover:border-orange-500 rounded-lg p-4 relative overflow-hidden transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="absolute top-2 right-2 w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-400/50">
                    <span className="font-bold text-orange-400 text-xs">{getPositionLabel(prize.position)}</span>
                  </div>

                  <div className="relative z-10 pt-2">
                    <div className="w-12 h-12 mx-auto mb-3 text-orange-500/60">
                      {getPrizeIcon(prize.position)}
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-orange-400 mb-1">
                        {formatMonetaryPrize(prize.monetary_amount, prize.currency, false)}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide truncate">
                        {prize.title}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonetaryPodium;
