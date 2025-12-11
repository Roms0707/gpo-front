import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfigContextState, ProjectConfiguration, TailwindColorPalette, LegalVariables, AuthMethod } from '../types/projectConfig';
import { projectConfigService } from '../services/projectConfigService';
import { tailwindColorService } from '../services/tailwindColorService';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { APP_CONFIG } from '../constants';

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
    accentColor: null,
    productId: null,
    campaignId: null,
    authMethod: 'email' as AuthMethod,
    subscriptionRedirectUrl: null,
    tailwindPalette: null,
    legalVariables: {
      support_email: null,
      legal_email: null,
      privacy_email: null,
      company_name: null,
      company_address: null,
      phone_number: null,
      registration_number: null,
    },
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
      accentColor: config.accent_color || 'not set',
      authMethod: config.auth_method || 'email',
    });
    console.log('[AppConfigContext] ═══════════════════════════════════════════');

    const palette = tailwindColorService.buildTailwindPalette(
      config.primary_color,
      config.secondary_color,
      config.accent_color
    );

    tailwindColorService.applyTailwindColors(palette);

    const legalVariables: LegalVariables = {
      support_email: config.support_email || null,
      legal_email: config.legal_email || null,
      privacy_email: config.privacy_email || null,
      company_name: config.company_name || null,
      company_address: config.company_address || null,
      phone_number: config.phone_number || null,
      registration_number: config.registration_number || null,
    };

    setState({
      configId: config.config_id,
      configName: config.config_name,
      brandName: config.brand_name,
      logo: config.logo_path,
      favicon: config.favicon_path,
      logoAltText: config.logo_alt_text,
      primaryColor: config.primary_color,
      secondaryColor: config.secondary_color,
      accentColor: config.accent_color || null,
      productId: config.product_id,
      campaignId: config.campaign_id,
      authMethod: (config.auth_method || 'email') as AuthMethod,
      subscriptionRedirectUrl: config.subscription_redirect_url || null,
      tailwindPalette: palette,
      legalVariables,
      isLoading: false,
    });

    await projectConfigService.preloadAssets(config);

    console.log('[AppConfigContext] ✓ Configuration applied successfully');
  };

  const refreshConfiguration = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const config = await projectConfigService.refreshConfiguration();
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
        console.log('[AppConfigContext] ═══════════════════════════════════════════');
        console.log('[AppConfigContext] Starting configuration initialization');
        console.log('[AppConfigContext] Service will detect domain automatically');

        const config = await projectConfigService.getProjectConfiguration();
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
    if (state.isLoading || !state.configId) {
      return;
    }

    let realtimeChannel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        console.log('[AppConfigContext] 🔄 Setting up Realtime subscription');
        console.log('[AppConfigContext] Monitoring config_id:', state.configId);

        realtimeChannel = supabase
          .channel(`project_configurations:${state.configId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'project_configurations',
              filter: `config_id=eq.${state.configId}`,
            },
            async (payload) => {
              console.log('[AppConfigContext] 🎨 Configuration UPDATE detected via Realtime:', payload);
              console.log('[AppConfigContext] Refreshing configuration automatically...');

              try {
                const config = await projectConfigService.refreshConfiguration();
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
  }, [state.isLoading, state.configId]);

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
