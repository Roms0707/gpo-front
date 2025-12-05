import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentDomain } from '../utils/domainDetection';

interface ProjectConfig {
  config_id: string;
  brand_name: string;
  logo_path: string;
  favicon_path: string;
  logo_alt_text: string;
  primary_color: string;
  secondary_color: string;
  domain?: string;
}

export const useProjectConfig = () => {
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        console.log('[useProjectConfig] Starting configuration fetch');
        const detectedDomain = getCurrentDomain();

        if (detectedDomain) {
          console.log(`[useProjectConfig] Detected domain: ${detectedDomain}, trying domain-based lookup`);

          const { data: domainData, error: domainError } = await supabase
            .from('project_configurations')
            .select('config_id, brand_name, logo_path, favicon_path, logo_alt_text, primary_color, secondary_color, domain')
            .eq('domain', detectedDomain)
            .eq('is_active', true)
            .maybeSingle();

          if (!domainError && domainData) {
            console.log('[useProjectConfig] Domain-based configuration found');
            setConfig(domainData);
            setLoading(false);
            return;
          }

          console.log('[useProjectConfig] Domain lookup unsuccessful, falling back to config_id');
        }

        const configId = import.meta.env.VITE_PROJECT_CONFIG_ID || 'default';
        console.log(`[useProjectConfig] Using config_id: ${configId}`);

        const { data, error: configError } = await supabase
          .from('project_configurations')
          .select('config_id, brand_name, logo_path, favicon_path, logo_alt_text, primary_color, secondary_color, domain')
          .eq('config_id', configId)
          .eq('is_active', true)
          .maybeSingle();

        if (configError) throw configError;

        console.log('[useProjectConfig] Configuration loaded successfully');
        setConfig(data);
      } catch (err) {
        console.error('[useProjectConfig] Error fetching project configuration:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
};
