import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import LegalContentLayout from '../components/layout/LegalContentLayout';
import { useLegalVariables } from '../hooks/useLegalVariables';
import { useAppConfig } from '../contexts/AppConfigContext';

const TermsPage: React.FC = () => {
  const legalVars = useLegalVariables();
  const { brandName } = useAppConfig();

  return (
    <LegalContentLayout
      title="Conditions Générales d'Utilisation"
      icon={<FileText className="h-6 w-6 text-primary-500 mr-3" />}
    >
      <p>
        Bienvenue sur {brandName}. Les présentes Conditions Générales d'Utilisation régissent votre accès et utilisation de notre plateforme. En utilisant nos services, vous acceptez d'être lié par ces conditions.
      </p>

      <h2>1. Définitions</h2>
      <ul>
        <li><strong>"Plateforme"</strong> désigne le site web {brandName} et toutes ses sous-sections.</li>
        <li><strong>"Utilisateur"</strong> désigne toute personne qui accède à la Plateforme, qu'elle soit inscrite ou non.</li>
        <li><strong>"Participant"</strong> désigne tout Utilisateur inscrit qui participe ou souhaite participer à un tournoi.</li>
        <li><strong>"Compte"</strong> désigne l'espace personnel créé par l'Utilisateur inscrit sur la Plateforme.</li>
        <li><strong>"Tournoi"</strong> désigne toute compétition organisée via la Plateforme.</li>
        <li><strong>"Contenu"</strong> désigne l'ensemble des éléments présents sur la Plateforme (textes, images, logos, codes, etc.).</li>
      </ul>

      <h2>2. Inscription et Compte</h2>
      <h3>2.1 Conditions d'inscription</h3>
      <p>
        L'inscription à la Plateforme est ouverte à toute personne physique. Les personnes mineures doivent obtenir l'autorisation préalable de leurs parents ou représentants légaux. Un accord parental signé est requis pour les utilisateurs de moins de 18 ans.
      </p>
      
      <h3>2.2 Processus d'inscription</h3>
      <p>
        Lors de son inscription, l'Utilisateur doit fournir des informations exactes, complètes et à jour. Il s'engage à mettre à jour régulièrement ces informations si nécessaire.
      </p>
      
      <h3>2.3 Sécurité du compte</h3>
      <p>
        L'Utilisateur est seul responsable de la préservation de la confidentialité de son identifiant et de son mot de passe, ainsi que de toutes les activités qui se déroulent sur son Compte. L'Utilisateur doit immédiatement informer {brandName} de toute utilisation non autorisée de son Compte.
      </p>

      <h2>3. Participation aux Tournois</h2>
      <h3>3.1 Conditions de participation</h3>
      <p>
        La participation aux Tournois est soumise aux conditions spécifiques de chaque Tournoi, qui peuvent inclure des restrictions d'âge, de pays de résidence, et d'autres critères. Ces conditions sont précisées sur la page du Tournoi concerné.
      </p>

      <h3>3.2 Comportement des participants</h3>
      <p>
        Les Participants s'engagent à adopter un comportement respectueux et fair-play. Toute forme de triche, de comportement antisportif, de discours haineux ou de harcèlement est strictement interdite et peut entraîner une exclusion immédiate.
      </p>

      <h3>3.3 Responsabilité technique</h3>
      <p>
        Les Participants sont responsables de leur propre matériel et connexion internet. {brandName} ne pourra être tenue responsable des problèmes techniques individuels rencontrés par les Participants.
      </p>

      <h3>3.4 Droit à l'image</h3>
      <p>
        En participant à un Tournoi, le Participant autorise {brandName} à utiliser son nom, son pseudonyme et son image pour la promotion des Tournois et de la Plateforme, sans rémunération supplémentaire.
      </p>

      <h2>4. Récompenses et Gains</h2>
      <h3>4.1 Attribution des récompenses</h3>
      <p>
        Les récompenses sont attribuées conformément aux règles spécifiques de chaque Tournoi. {brandName} se réserve le droit de vérifier l'identité et l'éligibilité des gagnants avant de décerner les prix.
      </p>

      <h3>4.2 Modalités de versement</h3>
      <p>
        Les modalités de versement des récompenses sont précisées dans les règles de chaque Tournoi. Les délais de versement peuvent varier selon la nature du prix et les contraintes administratives.
      </p>

      <h3>4.3 Responsabilité fiscale</h3>
      <p>
        Il appartient aux gagnants de déclarer leurs gains conformément à la législation fiscale en vigueur dans leur pays de résidence. {brandName} n'assume aucune responsabilité quant aux obligations fiscales des Participants.
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <h3>5.1 Contenu de la Plateforme</h3>
      <p>
        L'ensemble du Contenu présent sur la Plateforme (textes, images, logos, codes, etc.) est protégé par des droits de propriété intellectuelle et appartient à {legalVars.getCompanyName()} ou à ses partenaires. Toute reproduction non autorisée est interdite.
      </p>

      <h3>5.2 Licence limitée</h3>
      <p>
        {legalVars.getCompanyName()} accorde à l'Utilisateur une licence limitée, non exclusive et non transférable pour accéder et utiliser la Plateforme à des fins personnelles et non commerciales.
      </p>

      <h2>6. Protection des données personnelles</h2>
      <p>
        La collecte et le traitement des données personnelles des Utilisateurs sont régis par notre Politique de Confidentialité, accessible <Link to="/privacy" className="text-primary-500 hover:text-primary-400">ici</Link>.
      </p>

      <h2>7. Limitation de responsabilité</h2>
      <p>
        {brandName} s'efforce d'assurer au mieux l'accès et le fonctionnement de la Plateforme, mais ne peut garantir que son fonctionnement sera ininterrompu et sans erreur. {brandName} ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation de la Plateforme.
      </p>

      <h2>8. Modification des services et des conditions</h2>
      <p>
        {brandName} se réserve le droit de modifier, suspendre ou interrompre tout ou partie des services proposés sur la Plateforme, ainsi que de modifier les présentes Conditions Générales d'Utilisation à tout moment. Les Utilisateurs seront informés de toute modification substantielle.
      </p>

      <h2>9. Résiliation</h2>
      <p>
        {brandName} se réserve le droit de suspendre ou de résilier l'accès d'un Utilisateur à la Plateforme en cas de violation des présentes Conditions Générales d'Utilisation, sans préavis ni indemnité.
      </p>

      <h2>10. Droit applicable et juridiction compétente</h2>
      <p>
        Les présentes Conditions Générales d'Utilisation sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur exécution relèvera, à défaut de résolution amiable, de la compétence exclusive des tribunaux français.
      </p>

      <h2>11. Contact</h2>
      <p>
        Pour toute question relative aux présentes Conditions Générales d'Utilisation, vous pouvez contacter {brandName} à l'adresse email suivante : {legalVars.getLegalEmail()}.
      </p>
    </LegalContentLayout>
  );
};

export default TermsPage;