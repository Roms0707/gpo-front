import React from 'react';
import { Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import LegalContentLayout from '../components/layout/LegalContentLayout';
import { APP_CONFIG } from '../constants';

const LegalPage: React.FC = () => {
  return (
    <LegalContentLayout
      title="Mentions Légales"
      icon={<Building className="h-6 w-6 text-primary-500 mr-3" />}
    >
      <h2>1. Informations légales</h2>
      <h3>1.1 Éditeur du site</h3>
      <p>
        <strong>Raison sociale :</strong> Orange Arena<br />
        <strong>Adresse :</strong> 350 Rue denis papin, 13100 Aix-en-Provence<br />
        <strong>Email :</strong> Customer@orangearena.com
      </p>
      
      <h3>1.3 Hébergeur du site</h3>
      <p>
        Le site Orange Arena est hébergé par :<br />
        <strong>Digital Virgo</strong><br />
        Address: 350 Rue denis papin, 13100 Aix en Provence<br />
      </p>
      <p>
        <strong>Supabase Technologies, Inc.</strong><br />
        Address: 3650 Langton St, San Francisco, CA 94116, USA<br />
        Site web : https://supabase.com<br />
        Email : support@supabase.io
      </p>

      <h2>2. Présentation du site</h2>
      <p>
        Le site Orange Arena a pour objet de fournir une plateforme de gestion et d'organisation de tournois de jeux vidéo (esport) permettant aux utilisateurs de s'inscrire, participer à des compétitions et suivre les résultats.
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <h3>3.1 Titularité des droits</h3>
      <p>
        L'ensemble du contenu du site Orange Arena (architecture, textes, logos, images, éléments graphiques, sonores, logiciels, etc.) est la propriété exclusive de Digital Virgo ou fait l'objet d'une autorisation d'utilisation.
      </p>
      
      <h3>3.2 Droits d'utilisation</h3>
      <p>
        Toute reproduction, représentation, modification, publication, adaptation totale ou partielle des éléments du site, par quelque procédé que ce soit, sans l'autorisation expresse écrite de Digital Virgo, est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
      </p>
      
      <h3>3.3 Marques</h3>
      <p>
        Les marques, logos et signes distinctifs reproduits sur le site sont protégés par le droit des marques. Toute reproduction non autorisée est constitutive de contrefaçon.
      </p>

      <h2>4. Liens hypertextes</h2>
      <h3>4.1 Liens vers Orange Arena</h3>
      <p>
        La création de liens hypertextes vers le site Orange Arena est autorisée, à condition que ces liens soient simples et qu'ils ouvrent le site dans une nouvelle fenêtre du navigateur. Ils ne doivent pas suggérer que Digital Virgo approuve le contenu du site lié ou y soit associé de quelque manière que ce soit.
      </p>
      
      <h3>4.2 Liens depuis Orange Arena</h3>
      <p>
        Le site Orange Arena peut contenir des liens hypertextes vers d'autres sites web. Digital Virgo n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou aux pratiques de leurs exploitants.
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
        Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, Digital Virgo adhère au Service du Médiateur du e-commerce de la FEVAD (Fédération du e-commerce et de la vente à distance).
      </p>
      <p>
        Après démarche préalable écrite des consommateurs vis-à-vis de Digital Virgo, le Service du Médiateur peut être saisi pour tout litige de consommation dont le règlement n'aurait pas abouti. Pour connaître les modalités de saisine du Médiateur : www.mediateurfevad.fr
      </p>

      <h2>8. Modifications des mentions légales</h2>
      <p>
        Digital Virgo se réserve le droit de modifier les présentes mentions légales à tout moment. Les utilisateurs sont invités à les consulter régulièrement.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse email suivante : customer@orangearena.tn.
      </p>
    </LegalContentLayout>
  );
};

export default LegalPage;