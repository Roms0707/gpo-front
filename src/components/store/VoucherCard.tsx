import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface Voucher {
  id: string;
  game: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
}

interface VoucherCardProps {
  voucher: Voucher;
}

const VoucherCard: React.FC<VoucherCardProps> = ({ voucher }) => {
  const { t } = useTranslation();

  const formatPrice = (price: number, currency: string) => {
    if (Number.isInteger(price)) {
      return `${price}${currency}`;
    }
    return `${price.toFixed(2)}${currency}`;
  };

  return (
    <Link
      to={`/store/voucher/${voucher.id}`}
      className="block group"
    >
      <div className="bg-dark-200 rounded-xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-black/20 border border-gray-800/50 hover:border-gray-700/50">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={voucher.imageUrl}
            alt={voucher.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-200/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">
            {voucher.game}
          </p>

          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-white text-sm leading-tight flex-1">
              {voucher.name}
            </h3>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-[10px] text-gray-400 uppercase">
                {t('store.available')}
              </span>
              <span className="font-bold text-white text-lg">
                {formatPrice(voucher.price, voucher.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VoucherCard;
