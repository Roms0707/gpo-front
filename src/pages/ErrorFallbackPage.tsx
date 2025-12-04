import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, MessageCircle } from 'lucide-react';

interface ErrorFallbackPageProps {
  error?: Error;
  resetError?: () => void;
}

const ErrorFallbackPage: React.FC<ErrorFallbackPageProps> = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (resetError) resetError();
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 bg-gray-50 dark:bg-dark-200">
      <div className="max-w-2xl w-full bg-white dark:bg-dark-100 rounded-xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-error-100 dark:bg-error-900/30 mb-6">
            <svg
              className="w-10 h-10 text-error-600 dark:text-error-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Erreur de chargement
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Nous n'avons pas pu charger cette page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Une erreur technique s'est produite lors du chargement de la page.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-8 p-4 bg-gray-100 dark:bg-dark-300 rounded-lg border border-gray-300 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Détails de l'erreur (développement uniquement) :
            </h2>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap break-words">
              {error.toString()}
            </pre>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleReload}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            <RefreshCw className="h-5 w-5" />
            Recharger la page
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-dark-300 dark:hover:bg-dark-400 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            <Home className="h-5 w-5" />
            Retour à l'accueil
          </button>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Si le problème persiste, notre équipe de support est là pour vous aider.
          </p>
          <button
            onClick={handleContactSupport}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter le support
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallbackPage;
