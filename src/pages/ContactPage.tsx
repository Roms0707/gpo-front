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
              Contactez-nous
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <div className="space-y-6">
                <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                    <Mail className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Envoyez-nous un email directement
                  </p>
                  <a href={`mailto:${legalVars.getSupportEmail()}`} className="text-primary-500 hover:text-primary-400 flex items-center">
                    {legalVars.getSupportEmail()}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </div>
                
                <div className="bg-white dark:bg-dark-100 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-lg mb-4">
                    <MessageSquare className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">Discord</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Rejoignez notre serveur Discord pour un support en direct
                  </p>
                  <a href={legalVars.getDiscordUrl()} className="text-primary-500 hover:text-primary-400 flex items-center">
                    {legalVars.getDiscordUrl().replace('https://', '')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </div>
                
                <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 p-6 rounded-xl">
                  <h3 className="font-heading font-semibold text-xl mb-2 text-gray-900 dark:text-white">Besoin d'aide ?</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Consultez notre FAQ et centre d'aide pour trouver rapidement des réponses à vos questions
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Link to="/faq" className="text-gray-900 dark:text-white hover:text-primary-400 flex items-center">
                      Voir la FAQ
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                    <Link to="/support" className="text-gray-900 dark:text-white hover:text-primary-400 flex items-center">
                      Centre d'aide
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
                    Formulaire de contact
                  </h2>
                </div>
                
                {isSubmitted ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-success-600/20 text-success-500 rounded-full mb-4">
                      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-heading font-medium text-xl mb-2 text-gray-900 dark:text-white">Message envoyé avec succès !</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Merci de nous avoir contactés. Notre équipe vous répondra dans les meilleurs délais.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button 
                        onClick={() => setIsSubmitted(false)} 
                        className="btn btn-outline"
                      >
                        Envoyer un autre message
                      </button>
                      <Link to="/" className="btn btn-primary">
                        Retour à l'accueil
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="label">
                          Nom <span className="text-error-500">*</span>
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
                          Email <span className="text-error-500">*</span>
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
                        Sujet <span className="text-error-500">*</span>
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
                        Catégorie <span className="text-error-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="input"
                        required
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        <option value="account">Problème de compte</option>
                        <option value="tournament">Question sur les tournois</option>
                        <option value="technical">Problème technique</option>
                        <option value="payment">Paiement et récompenses</option>
                        <option value="partnership">Partenariats</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="label">
                        Message <span className="text-error-500">*</span>
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
                      >
                        {isSubmitting ? (
                          <span>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Envoi en cours...
                          </span>
                        ) : (
                          'Envoyer le message'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          {/* FAQ Preview */}
          <div className="mt-12 p-8 bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-2xl mb-2 text-gray-900 dark:text-white">
                Questions fréquemment posées
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Consultez notre FAQ pour trouver rapidement des réponses à vos questions
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 rounded-lg cursor-pointer transition-colors border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Comment puis-je m'inscrire à un tournoi ?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Procédure d'inscription et conditions de participation</p>
              </div>
              
              <div className="p-4 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 rounded-lg cursor-pointer transition-colors border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Comment sont versés les gains des tournois ?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Informations sur le versement des récompenses</p>
              </div>
              
              <div className="p-4 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 rounded-lg cursor-pointer transition-colors border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Quelles sont les conditions de participation pour les mineurs ?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Règles spécifiques pour les joueurs de moins de 18 ans</p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link to="/faq" className="text-primary-500 hover:text-primary-400 inline-flex items-center">
                Voir toutes les questions
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