export const updateFavicon = (faviconUrl: string) => {
  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach(favicon => favicon.remove());

  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = faviconUrl;
  document.head.appendChild(link);
};
