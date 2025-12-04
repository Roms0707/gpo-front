import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfigContextState, ProjectConfiguration, TailwindColorPalette } from '../types/projectConfig';
import { projectConfigService } from '../services/projectConfigService';
import { tailwindColorService } from '../services/tailwindColorService';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const AppConfigContext = createContext<AppConfigContextState | undefined>(undefined);

interface AppConfigProviderProps {
  children: ReactNode;
}

export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({ children }) => {
  const [state, setState] = useState<Omit<AppConfigContextState, 'refreshConfiguration'>>({
    configId: 'default',
    configName: 'Default Configuration',
    brandName: 'Orange Arena',
    logo: '/assets/logos/logo-default.svg',
    favicon: '/assets/favicons/favicon-default.svg',
    logoAltText: 'Orange Arena E-Sport',
    primaryColor: '#FF6B00',
    secondaryColor: '#000000',
    productId: null,
    campaignId: null,
    tailwindPalette: null,
    isLoading: true,
  });

  const applyConfiguration = async (config: ProjectConfiguration) => {
    console.log('[AppConfigContext] ═══════════════════════════════════════════');
    console.log('[AppConfigContext] 🎨 Applying configuration:', {
      configId: config.config_id,
      configName: config.config_name,
      brandName: config.brand_name,
      primaryColor: config.primary_color,
      secondaryColor: config.secondary_color,
    });
    console.log('[AppConfigContext] ═══════════════════════════════════════════');

    const palette = tailwindColorService.buildTailwindPalette(
      config.primary_color,
      config.secondary_color
    );

    tailwindColorService.applyTailwindColors(palette);

    setState({
      configId: config.config_id,
      configName: config.config_name,
      brandName: config.brand_name,
      logo: config.logo_path,
      favicon: config.favicon_path,
      logoAltText: config.logo_alt_text,
      primaryColor: config.primary_color,
      secondaryColor: config.secondary_color,
      productId: config.product_id,
      campaignId: config.campaign_id,
      tailwindPalette: palette,
      isLoading: false,
    });

    await projectConfigService.preloadAssets(config);

    console.log('[AppConfigContext] ✓ Configuration applied successfully');
  };

  const refreshConfiguration = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const configId = import.meta.env.VITE_PROJECT_CONFIG_ID || 'default';
      const config = await projectConfigService.refreshConfiguration(configId);
      await applyConfiguration(config);
    } catch (error) {
      console.error('[AppConfigContext] Error refreshing configuration:', error);
      const fallback = projectConfigService.getFallbackConfig();
      await applyConfiguration(fallback);
    }
  };

  useEffect(() => {
    const initializeConfiguration = async () => {
      try {
        console.log('[AppConfigContext] Starting configuration initialization');

        const configId = import.meta.env.VITE_PROJECT_CONFIG_ID || 'default';
        console.log(`[AppConfigContext] Loading config_id: ${configId}`);

        const config = await projectConfigService.getProjectConfiguration(configId);
        await applyConfiguration(config);
      } catch (error) {
        console.error('[AppConfigContext] Error initializing configuration:', error);
        const fallback = projectConfigService.getFallbackConfig();
        await applyConfiguration(fallback);
      }
    };

    initializeConfiguration();
  }, []);

  useEffect(() => {
    const configId = import.meta.env.VITE_PROJECT_CONFIG_ID || 'default';
    let realtimeChannel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        console.log('[AppConfigContext] 🔄 Setting up Realtime subscription for config_id:', configId);

        realtimeChannel = supabase
          .channel(`project_configurations:${configId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'project_configurations',
              filter: `config_id=eq.${configId}`,
            },
            async (payload) => {
              console.log('[AppConfigContext] 🎨 Configuration UPDATE detected via Realtime:', payload);
              console.log('[AppConfigContext] Refreshing configuration automatically...');

              try {
                const config = await projectConfigService.refreshConfiguration(configId);
                await applyConfiguration(config);
                console.log('[AppConfigContext] ✓ Configuration automatically refreshed and applied');
              } catch (error) {
                console.error('[AppConfigContext] Error refreshing configuration after Realtime update:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log('[AppConfigContext] Realtime subscription status:', status);
          });
      } catch (error) {
        console.error('[AppConfigContext] Error setting up Realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (realtimeChannel) {
        console.log('[AppConfigContext] 🔌 Unsubscribing from Realtime channel');
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const value: AppConfigContextState = {
    ...state,
    refreshConfiguration,
  };

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};
