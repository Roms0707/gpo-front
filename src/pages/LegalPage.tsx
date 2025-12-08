import React from 'react';
import { Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalContentLayout from '../components/layout/LegalContentLayout';
import { useLegalVariables } from '../hooks/useLegalVariables';
import { useAppConfig } from '../contexts/AppConfigContext';

const LegalPage: React.FC = () => {
  const legalVars = useLegalVariables();
  const { brandName } = useAppConfig();

  return (
    <LegalContentLayout
      title="Mentions Légales"
      icon={<Building className="h-6 w-6 text-primary-500 mr-3" />}
    >
      <h2>1. Informations légales</h2>
      <h3>1.1 Éditeur du site</h3>
      <p>
        <strong>Raison sociale :</strong> {legalVars.getCompanyName()}<br />
        <strong>Adresse :</strong> {legalVars.getCompanyAddress()}<br />
        {legalVars.getPhoneNumber() && (
          <>
            <strong>Téléphone :</strong> {legalVars.getPhoneNumber()}<br />
          </>
        )}
        {legalVars.getRegistrationNumber() && (
          <>
            <strong>Numéro d'immatriculation :</strong> {legalVars.getRegistrationNumber()}<br />
          </>
        )}
        <strong>Email :</strong> {legalVars.getSupportEmail()}
      </p>
      
      <h3>1.3 Hébergeur du site</h3>
      <p>
        Le site {brandName} est hébergé par :<br />
        <strong>{legalVars.getCompanyName()}</strong><br />
        Adresse : {legalVars.getCompanyAddress()}<br />
      </p>
      <p>
        <strong>Supabase Technologies, Inc.</strong><br />
        Address: 3650 Langton St, San Francisco, CA 94116, USA<br />
        Site web : https://supabase.com<br />
        Email : support@supabase.io
      </p>

      <h2>2. Présentation du site</h2>
      <p>
        Le site {brandName} a pour objet de fournir une plateforme de gestion et d'organisation de tournois de jeux vidéo (esport) permettant aux utilisateurs de s'inscrire, participer à des compétitions et suivre les résultats.
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <h3>3.1 Titularité des droits</h3>
      <p>
        L'ensemble du contenu du site {brandName} (architecture, textes, logos, images, éléments graphiques, sonores, logiciels, etc.) est la propriété exclusive de {legalVars.getCompanyName()} ou fait l'objet d'une autorisation d'utilisation.
      </p>

      <h3>3.2 Droits d'utilisation</h3>
      <p>
        Toute reproduction, représentation, modification, publication, adaptation totale ou partielle des éléments du site, par quelque procédé que ce soit, sans l'autorisation expresse écrite de {legalVars.getCompanyName()}, est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
      </p>
      
      <h3>3.3 Marques</h3>
      <p>
        Les marques, logos et signes distinctifs reproduits sur le site sont protégés par le droit des marques. Toute reproduction non autorisée est constitutive de contrefaçon.
      </p>

      <h2>4. Liens hypertextes</h2>
      <h3>4.1 Liens vers {brandName}</h3>
      <p>
        La création de liens hypertextes vers le site {brandName} est autorisée, à condition que ces liens soient simples et qu'ils ouvrent le site dans une nouvelle fenêtre du navigateur. Ils ne doivent pas suggérer que {legalVars.getCompanyName()} approuve le contenu du site lié ou y soit associé de quelque manière que ce soit.
      </p>

      <h3>4.2 Liens depuis {brandName}</h3>
      <p>
        Le site {brandName} peut contenir des liens hypertextes vers d'autres sites web. {legalVars.getCompanyName()} n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou aux pratiques de leurs exploitants.
      </p>

      <h2>5. Protection des données personnelles</h2>
      <p>
        Les informations concernant la collecte et le traitement des données personnelles sont détaillées dans notre <Link to="/privacy" className="text-primary-500 hover:text-primary-400">Politique de Confidentialité</Link>.
      </p>

      <h2>6. Droit applicable et juridiction compétente</h2>
      <p>
        Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
      </p>

      <h2>7. Médiation de la consommation</h2>
      <p>
        Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, {legalVars.getCompanyName()} adhère au Service du Médiateur du e-commerce de la FEVAD (Fédération du e-commerce et de la vente à distance).
      </p>
      <p>
        Après démarche préalable écrite des consommateurs vis-à-vis de {legalVars.getCompanyName()}, le Service du Médiateur peut être saisi pour tout litige de consommation dont le règlement n'aurait pas abouti. Pour connaître les modalités de saisine du Médiateur : www.mediateurfevad.fr
      </p>

      <h2>8. Modifications des mentions légales</h2>
      <p>
        {legalVars.getCompanyName()} se réserve le droit de modifier les présentes mentions légales à tout moment. Les utilisateurs sont invités à les consulter régulièrement.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse email suivante : {legalVars.getLegalEmail()}.
      </p>
    </LegalContentLayout>
  );
};

export default LegalPage;