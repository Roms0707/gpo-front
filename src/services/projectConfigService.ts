import { supabase } from '../lib/supabase';
import { ProjectConfiguration } from '../types/projectConfig';

interface CacheEntry {
  data: ProjectConfiguration;
  timestamp: number;
}

class ProjectConfigService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 0;

  private isValidCache(configId: string): boolean {
    const entry = this.cache.get(configId);
    if (!entry) return false;

    const now = Date.now();
    return (now - entry.timestamp) < this.CACHE_DURATION;
  }

  async getProjectConfiguration(configId: string): Promise<ProjectConfiguration> {
    console.log(`[ProjectConfigService] Loading configuration: ${configId}`);

    if (this.isValidCache(configId)) {
      console.log(`[ProjectConfigService] Using cached configuration for: ${configId}`);
      return this.cache.get(configId)!.data;
    }

    try {
      const { data, error } = await supabase
        .from('project_configurations')
        .select('*')
        .eq('config_id', configId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[ProjectConfigService] Supabase error:', error);
        throw new Error(`Failed to fetch configuration: ${error.message}`);
      }

      if (!data) {
        console.warn(`[ProjectConfigService] Configuration not found: ${configId}, using fallback`);
        return this.getFallbackConfig();
      }

      this.cache.set(configId, {
        data: data as ProjectConfiguration,
        timestamp: Date.now(),
      });

      console.log(`[ProjectConfigService] Configuration loaded and cached: ${configId}`);
      return data as ProjectConfiguration;
    } catch (error) {
      console.error('[ProjectConfigService] Error loading configuration:', error);
      console.log('[ProjectConfigService] Returning fallback configuration');
      return this.getFallbackConfig();
    }
  }

  getFallbackConfig(): ProjectConfiguration {
    console.log('[ProjectConfigService] Using fallback configuration');
    return {
      id: 'fallback-id',
      config_id: 'default',
      config_name: 'Default Fallback Configuration',
      is_active: true,
      brand_name: 'Orange Arena',
      logo_path: '/assets/logos/logo-default.svg',
      favicon_path: '/assets/favicons/favicon-default.svg',
      logo_alt_text: 'Orange Arena E-Sport',
      primary_color: '#FF6B00',
      secondary_color: '#000000',
      product_id: null,
      campaign_id: null,
      extra_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async preloadAssets(config: ProjectConfiguration): Promise<void> {
    const assets = [config.logo_path, config.favicon_path];

    const promises = assets.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => {
          console.warn(`[ProjectConfigService] Failed to preload: ${src}`);
          resolve(src);
        };
        img.src = src;
      });
    });

    await Promise.all(promises);
    console.log('[ProjectConfigService] Assets preloaded');
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[ProjectConfigService] Cache cleared');
  }

  clearSpecificCache(configId: string): void {
    this.cache.delete(configId);
    console.log(`[ProjectConfigService] Cache cleared for: ${configId}`);
  }

  async refreshConfiguration(configId: string): Promise<ProjectConfiguration> {
    this.clearSpecificCache(configId);
    return this.getProjectConfiguration(configId);
  }
}

export const projectConfigService = new ProjectConfigService();
