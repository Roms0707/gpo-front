import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

const GENSHIN_IMAGE = 'https://images.unsplash.com/photo-1636487658547-2f73f4117a7d?w=800&auto=format&fit=crop&q=80';

const voucherData: Record<string, { name: string; price: number; currency: string }> = {
  'genshin-60': { name: '60 GENESIS CRYSTALS', price: 1.11, currency: '£' },
  'genshin-330': { name: '300 + 30 GENESIS CRYSTALS', price: 5.59, currency: '£' },
  'genshin-welkin': { name: 'BLESSING OF THE WELKIN MOON', price: 5.59, currency: '£' },
  'genshin-1090': { name: '980 + 110 GENESIS CRYSTALS', price: 16.79, currency: '£' },
  'genshin-2240': { name: '1980 + 260 GENESIS CRYSTALS', price: 33.59, currency: '£' },
  'genshin-3880': { name: '3280 + 600 GENESIS CRYSTALS', price: 56, currency: '£' },
  'genshin-8080': { name: '6480 + 1600 GENESIS CRYSTALS', price: 112.01, currency: '£' },
};

const VoucherDetailPage: React.FC = () => {
  const { voucherId } = useParams<{ voucherId: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const voucher = voucherId ? voucherData[voucherId] : null;

  if (!voucher) {
    return (
      <div className="min-h-screen bg-dark-300 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Voucher not found</h1>
            <Link to="/store" className="text-primary-500 hover:text-primary-400">
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    if (Number.isInteger(price)) {
      return `${price}${currency}`;
    }
    return `${price.toFixed(2)}${currency}`;
  };

  return (
    <div className="min-h-screen bg-dark-300 pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <div className="bg-dark-200 rounded-2xl overflow-hidden border border-gray-800/50">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-square md:aspect-auto">
                <img
                  src={GENSHIN_IMAGE}
                  alt={voucher.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-8 flex flex-col">
                <p className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">
                  Genshin Impact
                </p>

                <h1 className="text-2xl font-bold text-white mb-4">
                  {voucher.name}
                </h1>

                <div className="flex items-center gap-2 mb-6">
                  <span className="text-3xl font-bold text-white">
                    {formatPrice(voucher.price, voucher.currency)}
                  </span>
                  <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    {t('store.available')}
                  </span>
                </div>

                <div className="flex-1" />

                <p className="text-gray-400 text-sm mb-6">
                  This is a placeholder for the voucher detail page. The full purchase flow will be implemented in step 2.
                </p>

                <button
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDetailPage;
