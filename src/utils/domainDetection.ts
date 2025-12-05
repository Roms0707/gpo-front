export const getCurrentDomain = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    console.log('[DomainDetection] Development environment detected, returning null');
    return null;
  }

  const normalizedDomain = hostname.toLowerCase();
  console.log(`[DomainDetection] Detected domain: ${normalizedDomain}`);

  return normalizedDomain;
};

export const isDevelopmentEnvironment = (): boolean => {
  if (typeof window === 'undefined') {
    return true;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
};
