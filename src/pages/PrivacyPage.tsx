import React from 'react';
import { Shield } from 'lucide-react';
import LegalContentLayout from '../components/layout/LegalContentLayout';
import { APP_CONFIG } from '../constants';

const PrivacyPage: React.FC = () => {
  return (
    <LegalContentLayout
      title="Politique de Confidentialité"
      icon={<Shield className="h-6 w-6 text-primary-500 mr-3" />}
    >
      <h2>1. Collecte des données personnelles</h2>
      <h3>1.1 Données que vous nous fournissez</h3>
      <p>
        Nous collectons les informations que vous nous fournissez directement lorsque vous :
      </p>
      <ul>
        <li>Créez un compte (nom d'utilisateur, adresse email, date de naissance, pays)</li>
        <li>Complétez votre profil (avatar, biographie, liens sociaux)</li>
        <li>Participez à des tournois (identifiants de jeu, informations d'équipe)</li>
        <li>Nous contactez via notre formulaire ou par email</li>
        <li>Pour les mineurs : document d'accord parental</li>
      </ul>
      
      <h3>1.2 Données collectées automatiquement</h3>
      <p>
        Lorsque vous utilisez notre plateforme, nous collectons automatiquement certaines informations techniques :
      </p>
      <ul>
        <li>Adresse IP et données de localisation approximative</li>
        <li>Type d'appareil, navigateur et système d'exploitation</li>
        <li>Pages consultées et activités sur la plateforme</li>
        <li>Cookies et technologies similaires (voir notre Politique de Cookies)</li>
      </ul>

      <h2>2. Utilisation des données</h2>
      <p>
        Nous utilisons vos données personnelles pour les finalités suivantes :
      </p>
      
      <h3>2.1 Fourniture de nos services</h3>
      <ul>
        <li>Gérer votre compte et votre profil</li>
        <li>Permettre votre participation aux tournois</li>
        <li>Vérifier votre éligibilité (âge, pays, etc.)</li>
        <li>Vous mettre en relation avec d'autres joueurs et équipes</li>
        <li>Distribuer les récompenses aux gagnants</li>
      </ul>
      
      <h3>2.2 Communication</h3>
      <ul>
        <li>Vous envoyer des notifications concernant vos tournois et matchs</li>
        <li>Répondre à vos demandes et questions</li>
        <li>Vous informer des changements de nos services</li>
        <li>Avec votre consentement, vous envoyer des newsletters et communications marketing</li>
      </ul>
      
      <h3>2.3 Amélioration et sécurité</h3>
      <ul>
        <li>Améliorer notre plateforme et nos services</li>
        <li>Analyser l'utilisation de nos services</li>
        <li>Détecter et prévenir les activités frauduleuses ou abusives</li>
        <li>Résoudre les problèmes techniques</li>
      </ul>

      <h2>3. Base légale du traitement</h2>
      <p>
        Nous traitons vos données personnelles sur les bases légales suivantes :
      </p>
      <ul>
        <li><strong>Exécution du contrat :</strong> Le traitement est nécessaire à l'exécution de notre contrat avec vous (nos Conditions Générales d'Utilisation).</li>
        <li><strong>Consentement :</strong> Vous nous avez donné votre consentement pour certains traitements spécifiques (par exemple, pour les communications marketing).</li>
        <li><strong>Intérêts légitimes :</strong> Le traitement est nécessaire aux fins de nos intérêts légitimes (améliorer nos services, assurer la sécurité) sans porter atteinte à vos droits fondamentaux.</li>
        <li><strong>Obligations légales :</strong> Le traitement est nécessaire pour respecter une obligation légale à laquelle nous sommes soumis.</li>
      </ul>

      <h2>4. Partage des données</h2>
      <h3>4.1 Avec votre consentement</h3>
      <p>
        Certaines de vos informations (nom d'utilisateur, performances dans les tournois) peuvent être rendues publiques dans le cadre de votre participation à nos tournois.
      </p>
      
      <h3>4.2 Prestataires de services</h3>
      <p>
        Nous partageons des données avec des prestataires de services tiers qui nous aident à fournir et améliorer nos services :
      </p>
      <ul>
        <li>Hébergement et infrastructure cloud</li>
        <li>Services de paiement pour la distribution des récompenses</li>
        <li>Outils d'analyse et de lutte contre la fraude</li>
        <li>Services de support client</li>
      </ul>
      <p>
        Ces prestataires sont contractuellement tenus de protéger vos données et de ne les utiliser que pour les finalités spécifiées.
      </p>
      
      <h3>4.3 Exigences légales</h3>
      <p>
        Nous pouvons divulguer vos informations si nous sommes légalement tenus de le faire ou si nous croyons de bonne foi que cela est nécessaire pour :
      </p>
      <ul>
        <li>Respecter une obligation légale, réglementaire ou judiciaire</li>
        <li>Protéger les droits, la propriété ou la sécurité d'Orange Arena, de nos utilisateurs ou du public</li>
      </ul>

      <h2>5. Transferts internationaux</h2>
      <p>
        Nous pouvons transférer vos données personnelles vers des pays situés en dehors de l'Union Européenne ou de votre pays de résidence. Dans ce cas, nous nous assurons que ces transferts sont encadrés par des garanties appropriées conformément aux réglementations applicables en matière de protection des données.
      </p>

      <h2>6. Conservation des données</h2>
      <p>
        Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services et atteindre les finalités décrites dans cette politique. Les périodes de conservation spécifiques dépendent du type de données et de leur finalité :
      </p>
      <ul>
        <li>Données de compte : Aussi longtemps que votre compte est actif</li>
        <li>Données de participation aux tournois : 3 ans après la fin du tournoi</li>
        <li>Documents d'accord parental : Jusqu'à la majorité du joueur + 1 an</li>
        <li>Communications avec le support : 2 ans après la résolution de la demande</li>
      </ul>
      <p>
        Au-delà de ces périodes, vos données sont soit supprimées, soit anonymisées.
      </p>

      <h2>7. Sécurité des données</h2>
      <p>
        Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre l'accès non autorisé, la perte, l'altération ou la destruction accidentelle. Ces mesures comprennent, sans s'y limiter :
      </p>
      <ul>
        <li>Chiffrement des données sensibles</li>
        <li>Contrôles d'accès stricts</li>
        <li>Audits de sécurité réguliers</li>
        <li>Formation de notre personnel</li>
      </ul>
      <p>
        Cependant, aucun système de sécurité n'est infaillible, et nous ne pouvons garantir la sécurité absolue de vos données.
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Conformément aux lois applicables sur la protection des données, vous disposez des droits suivants :
      </p>
      <ul>
        <li><strong>Droit d'accès :</strong> Vous pouvez demander une copie des données personnelles que nous détenons à votre sujet.</li>
        <li><strong>Droit de rectification :</strong> Vous pouvez demander la correction de vos données si elles sont inexactes ou incomplètes.</li>
        <li><strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de vos données dans certaines circonstances.</li>
        <li><strong>Droit à la limitation du traitement :</strong> Vous pouvez demander la restriction du traitement de vos données.</li>
        <li><strong>Droit à la portabilité :</strong> Vous pouvez demander le transfert de vos données dans un format structuré.</li>
        <li><strong>Droit d'opposition :</strong> Vous pouvez vous opposer au traitement de vos données, notamment à des fins de marketing direct.</li>
        <li><strong>Droit de retirer votre consentement :</strong> Lorsque le traitement est basé sur votre consentement.</li>
      </ul>
      <p>
        Pour exercer ces droits, veuillez nous contacter à privacy@esportzone.com. Nous répondrons à votre demande dans un délai d'un mois, sauf circonstances exceptionnelles.
      </p>

      <h2>9. Politique relative aux mineurs</h2>
      <p>
        Notre plateforme est accessible aux mineurs de plus de 13 ans avec les restrictions suivantes :
      </p>
      <ul>
        <li>Les mineurs de moins de 18 ans doivent obtenir l'autorisation de leurs parents ou tuteurs légaux</li>
        <li>Un document d'accord parental signé est requis lors de l'inscription</li>
        <li>Certains tournois peuvent avoir des restrictions d'âge supplémentaires</li>
      </ul>
      <p>
        Nous prenons des mesures particulières pour protéger la vie privée des mineurs et nous ne collectons pas délibérément plus de données que nécessaire pour fournir nos services.
      </p>

      <h2>10. Cookies et technologies similaires</h2>
      <p>
        Nous utilisons des cookies et technologies similaires pour améliorer votre expérience, analyser l'utilisation de notre plateforme et personnaliser le contenu. Pour plus d'informations sur notre utilisation des cookies, veuillez consulter notre Politique de Cookies.
      </p>

      <h2>11. Modifications de cette politique</h2>
      <p>
        Nous pouvons modifier cette Politique de Confidentialité de temps à autre. Les modifications entreront en vigueur dès la publication de la version mise à jour. Nous vous informerons de toute modification substantielle par email ou par notification sur notre plateforme.
      </p>

      <h2>12. Contact</h2>
      <p>
        Si vous avez des questions concernant cette Politique de Confidentialité ou la manière dont nous traitons vos données, veuillez nous contacter à :
      </p>
      <p>
        <strong>Société :</strong> {APP_CONFIG.CONTACT.COMPANY_NAME}<br />
        <strong>Adresse :</strong> {APP_CONFIG.CONTACT.COMPANY_ADDRESS}<br />
        <strong>Email :</strong> {APP_CONFIG.CONTACT.PRIVACY_EMAIL}
      </p>
      <p>
        Si vous n'êtes pas satisfait de notre réponse, vous avez le droit de déposer une plainte auprès de l'autorité de protection des données de votre pays de résidence.
      </p>
    </LegalContentLayout>
  );
}

export default PrivacyPage;