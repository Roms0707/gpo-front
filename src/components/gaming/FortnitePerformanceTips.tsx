import React from 'react';
import { Target, TrendingUp, Shield, Zap, Award, Users } from 'lucide-react';

interface FortnitePerformanceTipsProps {
  stats?: any;
}

const FortnitePerformanceTips: React.FC<FortnitePerformanceTipsProps> = ({ stats }) => {
  const getTips = () => {
    const tips = [];

    if (stats) {
      // Analyze wins and provide tips
      const totalWins = stats.wins || 0;
      const totalMatches = stats.matches || 0;
      const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;

      if (winRate < 5) {
        tips.push({
          icon: Target,
          title: "Améliorer le taux de victoire",
          description: "Concentrez-vous sur la survie plutôt que sur les éliminations. Restez dans la zone et évitez les combats inutiles.",
          color: "text-red-500"
        });
      }

      // Analyze K/D ratio
      const kills = stats.kills || 0;
      const deaths = stats.deaths || 1;
      const kd = kills / deaths;

      if (kd < 1) {
        tips.push({
          icon: Zap,
          title: "Améliorer le K/D",
          description: "Travaillez votre visée dans le mode créatif et choisissez mieux vos combats.",
          color: "text-orange-500"
        });
      }

      // Building tips
      tips.push({
        icon: Shield,
        title: "Maîtriser la construction",
        description: "La construction est essentielle dans Fortnite. Pratiquez les techniques de base comme les murs et rampes.",
        color: "text-blue-500"
      });
    }

    // General tips
    const generalTips = [
      {
        icon: TrendingUp,
        title: "Gestion des ressources",
        description: "Récoltez toujours des matériaux en début de partie et gérez vos munitions.",
        color: "text-green-500"
      },
      {
        icon: Award,
        title: "Positionnement",
        description: "Restez près du centre de la zone et anticipez les rotations.",
        color: "text-purple-500"
      },
      {
        icon: Users,
        title: "Jeu d'équipe",
        description: "En mode équipe, communiquez avec vos coéquipiers et restez groupés.",
        color: "text-indigo-500"
      }
    ];

    return [...tips, ...generalTips].slice(0, 4);
  };

  const tips = getTips();

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <Target className="w-5 h-5 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Conseils de Performance Fortnite
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, index) => {
          const IconComponent = tip.icon;
          return (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <IconComponent className={`w-5 h-5 ${tip.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {tip.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Astuce :</strong> Regardez les replays de vos parties pour analyser vos erreurs et améliorer votre gameplay.
        </p>
      </div>
    </div>
  );
};

export default FortnitePerformanceTips;
