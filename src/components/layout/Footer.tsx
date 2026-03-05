import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Swords, BookOpen, Users, BarChart3 } from 'lucide-react';
import { DynamicLogo } from '../common/DynamicLogo';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar, SIDEBAR_WIDTH } from '../../contexts/SidebarContext';
import { useTranslation } from 'react-i18next';


const footerLinks = {
  platform: [
    { key: 'home', to: '/', icon: Gamepad2 },
    { key: 'tournaments', to: '/tournaments', icon: Trophy },
    { key: 'leaderboards', to: '/leaderboards', icon: BarChart3 },
    { key: 'communities', to: '/communities', icon: Users },
  ],
  training: [
    { key: 'masterclasses', to: '/masterclasses', icon: BookOpen },
    { key: 'grindZone', to: '/grind-zone', icon: Swords },
    { key: 'howItWorks', to: '/faq' },
  ],
  help: [
    { key: 'faq', to: '/faq' },
    { key: 'support', to: '/support' },
    { key: 'contact', to: '/contact' },
  ],
  legal: [
    { key: 'terms', to: '/terms' },
    { key: 'privacy', to: '/privacy' },
    { key: 'legalNotice', to: '/legal' },
  ],
};


const FooterLinkColumn: React.FC<{
  titleKey: string;
  links: typeof footerLinks.platform;
  t: (key: string) => string;
  isDark: boolean;
}> = ({ titleKey, links, t, isDark }) => (
  <div>
    <h4
      className={`text-xs font-heading font-bold uppercase tracking-widest mb-4 ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`}
    >
      {t(`footer.${titleKey}`)}
    </h4>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.key}>
          <Link
            to={link.to}
            className={`group flex items-center gap-2 text-sm transition-all duration-200 ${
              isDark
                ? 'text-gray-400 hover:text-primary-400'
                : 'text-gray-500 hover:text-primary-600'
            }`}
          >
            {'icon' in link && link.icon && (
              <link.icon className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            )}
            <span className={`${'icon' in link && link.icon ? 'group-hover:translate-x-0 -translate-x-5' : ''} transition-transform duration-200`}>
              {t(`footer.${link.key}`)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { brandName } = useAppConfig();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isSidebarVisible } = useSidebar();
  const isDark = theme === 'dark';

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative overflow-hidden transition-[margin] duration-300 ${
        isDark ? 'bg-dark-300' : 'bg-gray-50'
      }`}
      style={{
        marginLeft: isSidebarVisible ? `${SIDEBAR_WIDTH}px` : '0px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--color-primary-500, #ff7900)08 0%, transparent 70%)'
            : 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--color-primary-500, #ff7900)05 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
              <Link to="/" className="inline-block mb-4">
                <DynamicLogo size="md" showBrandName={false} />
              </Link>
              <p
                className={`font-heading font-semibold text-lg mb-2 text-center lg:text-left ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {brandName}
              </p>
              <p
                className={`text-sm mb-6 max-w-xs text-center lg:text-left ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}
              >
                {t('footer.joinCompetition')}
              </p>

              <Link
                to="/tournaments"
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all duration-300 bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105 active:scale-95"
              >
                <Trophy className="w-4 h-4" />
                <span>{t('footer.browseTournaments')}</span>
              </Link>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                <FooterLinkColumn titleKey="platformLinks" links={footerLinks.platform} t={t} isDark={isDark} />
                <FooterLinkColumn titleKey="trainingLinks" links={footerLinks.training} t={t} isDark={isDark} />
                <FooterLinkColumn titleKey="help" links={footerLinks.help} t={t} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p
              className={`text-xs ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              {t('footer.copyright', { year: currentYear, brandName })}
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.legal.map((link, index) => (
                <React.Fragment key={link.key}>
                  {index > 0 && (
                    <span className={`text-xs ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
                      ·
                    </span>
                  )}
                  <Link
                    to={link.to}
                    className={`text-xs transition-colors duration-200 ${
                      isDark
                        ? 'text-gray-600 hover:text-primary-400'
                        : 'text-gray-400 hover:text-primary-600'
                    }`}
                  >
                    {t(`footer.${link.key}`)}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
