import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import PurchaseSuccessModal from '../components/store/PurchaseSuccessModal';

const GENSHIN_BANNER = 'https://images.unsplash.com/photo-1636487658547-2f73f4117a7d?w=1200&auto=format&fit=crop&q=80';
const GENSHIN_LOGO = 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg';

interface VoucherOption {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
}

const voucherOptions: VoucherOption[] = [
  { id: 'genshin-60', name: '60 GENESIS CRYSTALS', displayName: '60 Genesis Crystals', price: 1.11, currency: '£' },
  { id: 'genshin-330', name: '300 + 30 GENESIS CRYSTALS', displayName: '300 + 30 Genesis Crystals', price: 5.59, currency: '£' },
  { id: 'genshin-1090', name: '980 + 110 GENESIS CRYSTALS', displayName: '980 + 110 Genesis Crystals', price: 16.79, currency: '£' },
  { id: 'genshin-2240', name: '1980 + 260 GENESIS CRYSTALS', displayName: '1980 + 260 Genesis Crystals', price: 33.59, currency: '£' },
  { id: 'genshin-3880', name: '3280 + 600 GENESIS CRYSTALS', displayName: '3280 + 600 Genesis Crystals', price: 56, currency: '£' },
  { id: 'genshin-8080', name: '6480 + 1600 GENESIS CRYSTALS', displayName: '6480 + 1600 Genesis Crystals', price: 112.01, currency: '£' },
  { id: 'genshin-welkin', name: 'BLESSING OF THE WELKIN MOON', displayName: 'Blessing of the Welkin Moon', price: 5.59, currency: '£' },
];

const voucherDataMap: Record<string, VoucherOption> = voucherOptions.reduce((acc, v) => {
  acc[v.id] = v;
  return acc;
}, {} as Record<string, VoucherOption>);

const SERVERS = ['Europe', 'Asia', 'USA'];

const VoucherDetailPage: React.FC = () => {
  const { voucherId } = useParams<{ voucherId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [gameUserId, setGameUserId] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const voucher = voucherId ? voucherDataMap[voucherId] : null;

  const canCheckout = gameUserId.trim() !== '' && selectedServer !== '' && couponCode.trim() !== '';

  const handleVerify = () => {
    if (gameUserId.trim()) {
      setIsVerified(true);
    }
  };

  const handleCheckout = () => {
    if (canCheckout) {
      setShowSuccessModal(true);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate('/store');
  };

  if (!voucher) {
    return (
      <div className="min-h-screen bg-dark-300 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">{t('store.voucherNotFound')}</h1>
            <Link to="/store" className="text-primary-500 hover:text-primary-400">
              {t('store.returnToStore')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300">
      <div className="relative h-40 sm:h-48 md:h-64 mt-16 overflow-hidden">
        <img
          src={GENSHIN_BANNER}
          alt="Genshin Impact"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-300/50 to-dark-300" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10 pb-16">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-dark-200/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 lg:p-8 border border-gray-800/50">
            <div className="flex justify-center mb-4 sm:mb-6">
              <img
                src={GENSHIN_LOGO}
                alt="Genshin Impact Logo"
                className="h-24 sm:h-32 md:h-40 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-3 sm:mb-4">
              Genshin Impact
            </h1>

            <p className="text-gray-400 text-xs sm:text-sm text-center leading-relaxed mb-6 sm:mb-8">
              You and your sibling arrived here from another world. Separated by an unknown god,
              stripped of your powers, and cast into a deep slumber, you now awake to a world
              very different from when you first arrived. Thus begins your journey across Teyvat
              to seek answers from The Seven - the gods of each element. Along the way, prepare
              to explore every inch of this wondrous world, join forces with a diverse range of
              characters, and unravel the countless mysteries that Teyvat holds...
            </p>

            <div className="border-t border-gray-700/50 pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                {t('store.firstTopUpBonus')}
              </h3>

              <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                {t('store.firstTopUpDescription')}
              </p>

              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                <li>{t('store.topUpBonus60')}</li>
                <li>{t('store.topUpBonus330')}</li>
                <li>{t('store.topUpBonus1090')}</li>
                <li>{t('store.topUpBonus2240')}</li>
                <li>{t('store.topUpBonus3880')}</li>
                <li>{t('store.topUpBonus8080')}</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="bg-dark-200 rounded-xl border border-gray-800/50 overflow-hidden">
              <div className="bg-red-600/20 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-white text-sm sm:text-base font-medium">{t('store.userInformation')}</span>
              </div>

              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      {t('store.enterGameUserId')}
                    </label>
                    <input
                      type="text"
                      value={gameUserId}
                      onChange={(e) => {
                        setGameUserId(e.target.value);
                        if (isVerified) setIsVerified(false);
                      }}
                      className="w-full bg-dark-100 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      {t('store.selectServer')}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
                        className="w-full bg-dark-100 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-left flex items-center justify-between focus:outline-none focus:border-primary-500 transition-colors"
                      >
                        <span className={`text-sm sm:text-base ${selectedServer ? 'text-white' : 'text-gray-500'}`}>
                          {selectedServer || t('store.selectServerPlaceholder')}
                        </span>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isServerDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-dark-100 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                          {SERVERS.map((server) => (
                            <button
                              key={server}
                              type="button"
                              onClick={() => {
                                setSelectedServer(server);
                                setIsServerDropdownOpen(false);
                              }}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base text-white hover:bg-dark-200 transition-colors flex items-center justify-between"
                            >
                              <span>{server}</span>
                              {selectedServer === server && (
                                <Check className="w-4 h-4 text-primary-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!gameUserId.trim()}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                    isVerified
                      ? 'bg-green-600 text-white cursor-default'
                      : gameUserId.trim()
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isVerified ? t('store.verified') : t('store.verify')}
                </button>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    {t('store.enterEmailAddress')}
                  </label>
                  <p className="text-gray-500 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                    {t('store.emailReceiptNote')}
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-dark-100 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            <div className="bg-dark-200 rounded-xl border border-gray-800/50 overflow-hidden">
              <div className="bg-red-600/20 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-white text-sm sm:text-base font-medium">{t('store.selectAmount')}</span>
              </div>

              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {voucherOptions.map((option) => {
                    const isSelected = option.id === voucherId;
                    return (
                      <div
                        key={option.id}
                        className={`relative p-2.5 sm:p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-red-500 bg-dark-100'
                            : 'border-gray-700 bg-dark-100/50 opacity-60'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-4 h-4 sm:w-5 sm:h-5 rounded bg-red-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          </div>
                        )}
                        <p className="text-white text-[10px] sm:text-sm font-medium text-center">
                          {option.displayName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-dark-200 rounded-xl border border-gray-800/50 overflow-hidden">
              <div className="bg-red-600/20 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-white text-sm sm:text-base font-medium">{t('store.enterCouponCode')}</span>
              </div>

              <div className="p-3 sm:p-4">
                <label className="block text-gray-500 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                  {t('store.pleaseEnterCouponCode')}
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder=""
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!canCheckout}
                className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors ${
                  canCheckout
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('store.checkout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default VoucherDetailPage;
