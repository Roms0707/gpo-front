import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProjectConfig {
  config_id: string;
  brand_name: string;
  logo_path: string;
  favicon_path: string;
  logo_alt_text: string;
  primary_color: string;
  secondary_color: string;
}

export const useProjectConfig = () => {
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configId = import.meta.env.VITE_PROJECT_CONFIG_ID || 'default';

        const { data, error } = await supabase
          .from('project_configurations')
          .select('config_id, brand_name, logo_path, favicon_path, logo_alt_text, primary_color, secondary_color')
          .eq('config_id', configId)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;

        setConfig(data);
      } catch (err) {
        console.error('Error fetching project configuration:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
};
