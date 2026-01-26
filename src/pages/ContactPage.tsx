import React, { useState } from 'react';
import { Mail, MessageSquare, ArrowRight, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useLegalVariables } from '../hooks/useLegalVariables';

interface FormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const legalVars = useLegalVariables();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: user?.username || '',
    email: user?.email || '',
    subject: '',
    category: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.category || !formData.message) {
      toast.error(t('toast.fillAllFieldsError'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('toast.invalidEmailError'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real implementation, you would send the form data to your backend here
      console.log('Form submitted:', formData);

      toast.success(t('toast.messageSentSuccess'));
      setIsSubmitted(true);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t('toast.formSubmitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 bg-gray-50 dark:bg-dark-200">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl mb-4">
              {t('contactPage.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('contactPage.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <div className="space-y-6">
                <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                    <Mail className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">{t('contactPage.email.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {t('contactPage.email.description')}
                  </p>
                  <a
                    href={`mailto:${legalVars.getSupportEmail()}`}
                    className="text-primary-500 hover:text-primary-400 flex items-center"
                    aria-label={t('contactPage.email.ariaLabel')}
                  >
                    {legalVars.getSupportEmail()}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </div>

                <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                    <MessageSquare className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">{t('contactPage.discord.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {t('contactPage.discord.description')}
                  </p>
                  <a
                    href={legalVars.getDiscordUrl()}
                    className="text-primary-500 hover:text-primary-400 flex items-center"
                    aria-label={t('contactPage.discord.ariaLabel')}
                  >
                    {legalVars.getDiscordUrl().replace('https://', '')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </div>

                <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 p-6 rounded-xl">
                  <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">{t('contactPage.help.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t('contactPage.help.description')}
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Link to="/faq" className="text-gray-900 dark:text-white hover:text-primary-400 flex items-center">
                      {t('contactPage.help.viewFaq')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                    <Link to="/support" className="text-gray-900 dark:text-white hover:text-primary-400 flex items-center">
                      {t('contactPage.help.helpCenter')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="font-heading font-semibold text-2xl text-gray-900 dark:text-white">
                    {t('contactPage.form.title')}
                  </h2>
                </div>

                {isSubmitted ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-success-600/20 text-success-500 rounded-full mb-4">
                      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-heading font-medium text-xl mb-2 text-gray-900 dark:text-white">{t('contactPage.success.title')}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t('contactPage.success.description')}
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="btn btn-outline"
                      >
                        {t('contactPage.success.sendAnother')}
                      </button>
                      <Link to="/" className="btn btn-primary">
                        {t('contactPage.success.backToHome')}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="label">
                          {t('contactPage.form.name')} <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="label">
                          {t('contactPage.form.email')} <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="label">
                        {t('contactPage.form.subject')} <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="label">
                        {t('contactPage.form.category')} <span className="text-error-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="input"
                        required
                      >
                        <option value="">{t('contactPage.categories.placeholder')}</option>
                        <option value="account">{t('contactPage.categories.account')}</option>
                        <option value="tournament">{t('contactPage.categories.tournament')}</option>
                        <option value="technical">{t('contactPage.categories.technical')}</option>
                        <option value="payment">{t('contactPage.categories.payment')}</option>
                        <option value="partnership">{t('contactPage.categories.partnership')}</option>
                        <option value="other">{t('contactPage.categories.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="label">
                        {t('contactPage.form.message')} <span className="text-error-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="input min-h-[150px]"
                        required
                      ></textarea>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                        aria-label={t('contactPage.form.ariaSubmit')}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            {t('contactPage.form.submitting')}
                          </span>
                        ) : (
                          t('contactPage.form.submit')
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-2xl mb-2 text-gray-900 dark:text-white">
                {t('contactPage.faqPreview.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('contactPage.faqPreview.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              <Link to="/faq" className="block p-4 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">{t('contactPage.faqPreview.q1.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('contactPage.faqPreview.q1.description')}</p>
              </Link>

              <Link to="/faq" className="block p-4 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">{t('contactPage.faqPreview.q2.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('contactPage.faqPreview.q2.description')}</p>
              </Link>

              <Link to="/faq" className="block p-4 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">{t('contactPage.faqPreview.q3.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('contactPage.faqPreview.q3.description')}</p>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <Link to="/faq" className="text-primary-500 hover:text-primary-400 inline-flex items-center">
                {t('contactPage.faqPreview.viewAll')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
