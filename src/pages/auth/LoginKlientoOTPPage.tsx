import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAppConfig } from '../../contexts/AppConfigContext';
import AuthLayout from '../../components/auth/AuthLayout';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { useAuthStore } from '../../stores/authStore';
import { PhoneInput as ReactPhoneInput, ParsedCountry } from 'react-international-phone';
import 'react-international-phone/style.css';

type OtpStep = 'phone' | 'verify';

const LoginKlientoOTPPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { configId, brandName } = useAppConfig();
  const { sendOtp, verifyOtp } = useAuthStore();

  const [step, setStep] = useState<OtpStep>('phone');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('ET');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'verify' && countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, step]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!phone || phone.length < 10) {
      setError(t('loginPage.otp.invalidPhone'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await sendOtp(phone, configId, countryCode);

      if (!result.success) {
        setError(result.error || t('loginPage.otp.sendError'));
        toast.error(result.error || t('loginPage.otp.sendError'));
        return;
      }

      setStep('verify');
      setCountdown(result.expiresInSeconds || 60);
      setCanResend(false);
      toast.success(t('loginPage.otp.codeSent'));

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error('Send OTP error:', err);
      const errorMessage = err instanceof Error ? err.message : t('loginPage.otp.sendError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d !== '') && newDigits.join('').length === 4) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData.length === 4) {
      const newDigits = pastedData.split('');
      setOtpDigits(newDigits);
      handleVerifyOtp(pastedData);
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || otpDigits.join('');

    if (code.length !== 4) {
      setError(t('loginPage.otp.invalidCode'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await verifyOtp(phone, code, configId);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        setOtpDigits(['', '', '', '']);
        otpInputRefs.current[0]?.focus();
        return;
      }

      if (result.user) {
        toast.success(t('loginPage.loginSuccess'));
        navigate('/');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      const errorMessage = err instanceof Error ? err.message : t('loginPage.otp.verifyError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setOtpDigits(['', '', '', '']);
    setError(null);
    await handleSendOtp();
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setOtpDigits(['', '', '', '']);
    setError(null);
    setCountdown(0);
    setCanResend(false);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'verify') {
    return (
      <AuthLayout
        title={t('loginPage.otp.verifyTitle')}
        subtitle={t('loginPage.otp.verifySubtitle', { phone: phone.slice(-4).padStart(phone.length, '*') })}
      >
        {error && <ErrorMessage message={error} />}

        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                disabled={isSubmitting}
                className="w-14 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all disabled:opacity-50"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('loginPage.otp.expiresIn', { time: formatCountdown(countdown) })}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting || !canResend}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                {t('loginPage.otp.resendCode')}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleVerifyOtp()}
            disabled={isSubmitting || otpDigits.some(d => !d)}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">&#8635;</span>
                {t('loginPage.otp.verifying')}
              </>
            ) : (
              t('loginPage.otp.verify')
            )}
          </button>

          <button
            type="button"
            onClick={handleChangeNumber}
            className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('loginPage.otp.changeNumber')}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('loginPage.otp.title')}
      subtitle={t('loginPage.otp.subtitle', { brandName })}
    >
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label htmlFor="phone" className="label">
            {t('loginPage.otp.phoneLabel')}
          </label>
          <ReactPhoneInput
            defaultCountry="et"
            value={phone}
            onChange={(phone: string, meta: { country: ParsedCountry }) => {
              setPhone(phone);
              if (meta.country?.iso2) {
                setCountryCode(meta.country.iso2.toUpperCase());
              }
            }}
            disabled={isSubmitting}
            inputClassName="!w-full !py-2.5 !pl-12 !pr-4 !rounded-lg !border-gray-300 dark:!border-gray-600 dark:!bg-dark-200 !text-base focus:!ring-2 focus:!ring-primary-500/20 focus:!border-primary-500"
            countrySelectorStyleProps={{
              buttonClassName: '!border-gray-300 dark:!border-gray-600 dark:!bg-dark-200 !rounded-l-lg !pl-3 !pr-2',
            }}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('loginPage.otp.phoneHint')}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !phone || phone.length < 10}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">&#8635;</span>
              {t('loginPage.otp.sending')}
            </>
          ) : (
            <>
              <Phone className="w-5 h-5 mr-2" />
              {t('loginPage.otp.sendCode')}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t('loginPage.otp.infoMessage')}
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginKlientoOTPPage;
