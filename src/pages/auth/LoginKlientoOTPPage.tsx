import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAppConfig } from '../../contexts/AppConfigContext';
import AuthLayout from '../../components/auth/AuthLayout';
import ErrorMessage from '../../components/ui/ErrorMessage';
import AccountSuspendedModal from '../../components/ui/AccountSuspendedModal';
import { useAuthStore } from '../../stores/authStore';
import { BillingInfo } from '../../types';

type OtpStep = 'username' | 'verify';

const LoginKlientoOTPPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectConfigUuid, brandName, subscriptionRedirectUrl, defaultPhoneCountryCode } = useAppConfig();
  const { checkSubscription, sendOtp, verifyOtp } = useAuthStore();

  const [step, setStep] = useState<OtpStep>('username');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [klientoUserId, setKlientoUserId] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'verify' && countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, step]);

  const handleCheckSubscription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.trim().length < 3) {
      setError(t('loginPage.otp.invalidUsername'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await checkSubscription(username.trim(), projectConfigUuid);

      if (result.isSuspended) {
        setShowSuspendedModal(true);
        return;
      }

      const redirectUrl = result.redirectUrl || subscriptionRedirectUrl;
      if (!result.isSubscribed && redirectUrl) {
        toast.error(t('loginPage.otp.subscriptionRequired'));
        window.location.href = redirectUrl;
        return;
      }

      if (!result.success) {
        setError(result.error || t('loginPage.otp.checkError'));
        toast.error(result.error || t('loginPage.otp.checkError'));
        return;
      }

      if (!result.isSubscribed) {
        setError(t('loginPage.otp.subscriptionRequired'));
        toast.error(t('loginPage.otp.subscriptionRequired'));
        return;
      }

      if (!result.phoneNumber) {
        setError(t('loginPage.otp.noPhoneNumber'));
        return;
      }

      setPhone(result.phoneNumber);
      setKlientoUserId(result.userId);
      setBillingInfo(result.billingInfo);

      const otpResult = await sendOtp(result.phoneNumber, projectConfigUuid, result.billingInfo, defaultPhoneCountryCode);

      if (!otpResult.success) {
        setError(otpResult.error || t('loginPage.otp.sendError'));
        toast.error(otpResult.error || t('loginPage.otp.sendError'));
        return;
      }

      setStep('verify');
      setCountdown(otpResult.expiresInSeconds || 60);
      setCanResend(false);
      toast.success(t('loginPage.otp.codeSent'));

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error('Check subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : t('loginPage.otp.checkError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtpInternal = async () => {
    if (!phone) {
      setError(t('loginPage.otp.invalidPhone'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await sendOtp(phone, projectConfigUuid, billingInfo, defaultPhoneCountryCode);

      if (!result.success) {
        setError(result.error || t('loginPage.otp.sendError'));
        toast.error(result.error || t('loginPage.otp.sendError'));
        return;
      }

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

      const result = await verifyOtp(phone, code, projectConfigUuid, defaultPhoneCountryCode, klientoUserId);

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
    await handleResendOtpInternal();
  };

  const handleBack = () => {
    if (step === 'verify') {
      setStep('username');
      setOtpDigits(['', '', '', '']);
      setPhone('');
      setKlientoUserId(null);
      setBillingInfo(null);
      setError(null);
      setCountdown(0);
      setCanResend(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskPhoneNumber = (phoneNumber: string) => {
    if (phoneNumber.length <= 4) return phoneNumber;
    const lastFour = phoneNumber.slice(-4);
    const masked = '*'.repeat(phoneNumber.length - 4);
    return masked + lastFour;
  };

  if (step === 'verify') {
    return (
      <AuthLayout
        title={t('loginPage.otp.verifyTitle')}
        subtitle={t('loginPage.otp.verifySubtitle', { phone: maskPhoneNumber(phone) })}
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
            onClick={handleBack}
            className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('loginPage.otp.back')}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('loginPage.otp.title', { brandName })}
      subtitle={t('loginPage.otp.subtitle', { brandName })}
    >
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleCheckSubscription} className="space-y-4">
        <div>
          <label htmlFor="username" className="label">
            {t('loginPage.otp.usernameLabel')}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              placeholder={t('loginPage.otp.usernamePlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all disabled:opacity-50"
              autoComplete="username"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('loginPage.otp.usernameHint', { brandName })}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !username || username.trim().length < 3}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">&#8635;</span>
              {t('loginPage.otp.verifyingAndSending')}
            </>
          ) : (
            t('loginPage.otp.continue')
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t('loginPage.otp.infoMessage')}
        </p>
      </div>

      <AccountSuspendedModal
        isOpen={showSuspendedModal}
        onClose={() => setShowSuspendedModal(false)}
      />
    </AuthLayout>
  );
};

export default LoginKlientoOTPPage;
