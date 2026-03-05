import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAppConfig } from './AppConfigContext';
import { initializeSnowplow, trackDvLogin, isSnowplowReady } from '../services/snowplowService';
import type { DvLoginEvent } from '../services/snowplowService';

interface SnowplowContextState {
  trackDvLogin: (event: DvLoginEvent) => void;
  isReady: boolean;
}

const SnowplowContext = createContext<SnowplowContextState>({
  trackDvLogin: () => {},
  isReady: false,
});

export const SnowplowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { configId, isLoading } = useAppConfig();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoading || !configId) return;

    initializeSnowplow(configId).then(() => {
      setIsReady(isSnowplowReady());
    });
  }, [isLoading, configId]);

  const value: SnowplowContextState = {
    trackDvLogin,
    isReady,
  };

  return <SnowplowContext.Provider value={value}>{children}</SnowplowContext.Provider>;
};

export const useSnowplow = (): SnowplowContextState => {
  return useContext(SnowplowContext);
};
