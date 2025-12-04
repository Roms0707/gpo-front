import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../contexts/AppConfigContext';

export const useDynamicFavicon = () => {
  const { favicon, brandName } = useAppConfig();
  const { i18n } = useTranslation();

  useEffect(() => {
    const updateFavicon = () => {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }

      if (favicon.endsWith('.svg')) {
        link.type = 'image/svg+xml';
      } else if (favicon.endsWith('.png')) {
        link.type = 'image/png';
      } else if (favicon.endsWith('.ico')) {
        link.type = 'image/x-icon';
      }

      link.href = favicon;
    };

    const updateTitle = () => {
      document.title = brandName;
    };

    const updateHtmlLang = () => {
      document.documentElement.lang = i18n.language;
    };

    updateFavicon();
    updateTitle();
    updateHtmlLang();
  }, [favicon, brandName, i18n.language]);
};
