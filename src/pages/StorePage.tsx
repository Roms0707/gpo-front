import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import VoucherCard, { Voucher } from '../components/store/VoucherCard';

const GENSHIN_IMAGE = 'https://images.unsplash.com/photo-1636487658547-2f73f4117a7d?w=800&auto=format&fit=crop&q=80';

const genshinVouchers: Voucher[] = [
  {
    id: 'genshin-60',
    game: 'Genshin Impact',
    name: '60 GENESIS CRYSTALS',
    price: 1.11,
    currency: '£',
    imageUrl: GENSHIN_IMAGE,
  },
  {
    id: 'genshin-330',
    game: 'Genshin Impact',
    name: '300 + 30 GENESIS CRYSTALS',
    price: 5.59,
    currency: '£',
    imageUrl: GENSHIN_IMAGE,
  },
  {
    id: 'genshin-welkin',
    game: 'Genshin Impact',
    name: 'BLESSING OF THE WELKIN MOON',
    price: 5.59,
    currency: '£',
    imageUrl: GENSHIN_IMAGE,
  },
  {
    id: 'genshin-1090',
    game: 'Genshin Impact',
    name: '980 + 110 GENESIS CRYSTALS',
    price: 16.79,
    currency: '£',
    imageUrl: GENSHIN_IMAGE,
  },
  {
    id: 'genshin-2240',
    game: 'Genshin Impact',
    name: '1980 + 260 GENESIS CRYSTALS',
    price: 33.59,
    currency: '£',
    imageUrl: GENSHIN_IMAGE,
  },
  {
    id: 'genshin-3880',
    game: 'Genshin Impact',
    name: '3280 + 600 GENESIS CRYSTALS',
    price: 56,
    currency: '£',
    imageUrl: GENSHIN_IMAGE,
  },
  {
    id: 'genshin-8080',
    game: 'Genshin Impact',
    name: '6480 + 1600 GENESIS CRYSTALS',
    price: 112.01,
    currency: '£',
    imageUrl: GENSHIN_IMAGE,
  },
];

const StorePage: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-dark-300 pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm mb-6 md:mb-8">
          <span className="text-gray-400">{t('store.breadcrumbStore')}</span>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <span className="text-white font-medium">{t('store.breadcrumbVouchers')}</span>
        </nav>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-12 md:mb-16">
          {genshinVouchers.map((voucher) => (
            <VoucherCard key={voucher.id} voucher={voucher} />
          ))}
        </div>

        <div className="border-t border-gray-800/50 pt-8 md:pt-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">
            {t('store.ourVouchers')}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-dark-200 rounded-xl aspect-video flex items-center justify-center border border-gray-800/50">
              <span className="text-gray-500 text-sm">Coming soon</span>
            </div>
            <div className="bg-dark-200 rounded-xl aspect-video flex items-center justify-center border border-gray-800/50">
              <span className="text-gray-500 text-sm">Coming soon</span>
            </div>
            <div className="bg-dark-200 rounded-xl aspect-video flex items-center justify-center border border-gray-800/50">
              <span className="text-gray-500 text-sm">Coming soon</span>
            </div>
            <div className="bg-dark-200 rounded-xl aspect-video flex items-center justify-center border border-gray-800/50">
              <span className="text-gray-500 text-sm">Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePage;
