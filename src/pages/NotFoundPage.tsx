import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center">
      <div className="container mx-auto px-4 text-center">
        <Trophy className="h-20 w-20 text-primary-500 mx-auto mb-6 opacity-50" />
        
        <h1 className="font-heading font-bold text-4xl md:text-6xl mb-4">
          404
        </h1>
        
        <h2 className="font-heading font-semibold text-2xl md:text-3xl mb-6">
          Page introuvable
        </h2>
        
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <Link to="/" className="btn btn-primary px-8 py-3">
          Retourner à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;