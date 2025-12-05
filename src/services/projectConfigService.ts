import { supabase } from '../lib/supabase';
import { ProjectConfiguration } from '../types/projectConfig';
import { getCurrentDomain } from '../utils/domainDetection';

interface CacheEntry {
  data: ProjectConfiguration;
  timestamp: number;
}

class ProjectConfigService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 0;

  private isValidCache(cacheKey: string): boolean {
    const entry = this.cache.get(cacheKey);
    if (!entry) return false;

    const now = Date.now();
    return (now - entry.timestamp) < this.CACHE_DURATION;
  }

  private getCacheKey(identifier: string, isDomain: boolean = false): string {
    return isDomain ? `domain:${identifier}` : `config:${identifier}`;
  }

  async getConfigurationByDomain(domain: string): Promise<ProjectConfiguration | null> {
    console.log(`[ProjectConfigService] 🌐 Attempting domain-based lookup: ${domain}`);

    const cacheKey = this.getCacheKey(domain, true);
    if (this.isValidCache(cacheKey)) {
      console.log(`[ProjectConfigService] ✓ Using cached configuration for domain: ${domain}`);
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const { data, error } = await supabase
        .from('project_configurations')
        .select('*')
        .eq('domain', domain)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[ProjectConfigService] ❌ Supabase error during domain lookup:', error);
        return null;
      }

      if (!data) {
        console.log(`[ProjectConfigService] ℹ️  No configuration found for domain: ${domain}`);
        return null;
      }

      this.cache.set(cacheKey, {
        data: data as ProjectConfiguration,
        timestamp: Date.now(),
      });

      console.log(`[ProjectConfigService] ✓ Domain-based configuration loaded and cached: ${domain}`);
      return data as ProjectConfiguration;
    } catch (error) {
      console.error('[ProjectConfigService] ❌ Error during domain lookup:', error);
      return null;
    }
  }

  async getProjectConfiguration(configId?: string): Promise<ProjectConfiguration> {
    console.log('[ProjectConfigService] ═══════════════════════════════════════════');
    console.log('[ProjectConfigService] 🔍 Starting configuration lookup');

    const detectedDomain = getCurrentDomain();

    if (detectedDomain) {
      console.log(`[ProjectConfigService] 🌐 Domain detected: ${detectedDomain}`);
      console.log('[ProjectConfigService] 📍 Priority: Domain-based lookup');

      const domainConfig = await this.getConfigurationByDomain(detectedDomain);
      if (domainConfig) {
        console.log(`[ProjectConfigService] ✓ Domain-based configuration found!`);
        console.log('[ProjectConfigService] ═══════════════════════════════════════════');
        return domainConfig;
      }

      console.log('[ProjectConfigService] ℹ️  Domain lookup unsuccessful, falling back to config_id');
    } else {
      console.log('[ProjectConfigService] 🏠 Development environment detected or no domain');
      console.log('[ProjectConfigService] 📍 Using config_id-based lookup');
    }

    const effectiveConfigId = configId || import.meta.env.VITE_PROJECT_CONFIG_ID || 'default';
    console.log(`[ProjectConfigService] 🔑 config_id: ${effectiveConfigId}`);

    const cacheKey = this.getCacheKey(effectiveConfigId, false);
    if (this.isValidCache(cacheKey)) {
      console.log(`[ProjectConfigService] ✓ Using cached configuration for config_id: ${effectiveConfigId}`);
      console.log('[ProjectConfigService] ═══════════════════════════════════════════');
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const { data, error } = await supabase
        .from('project_configurations')
        .select('*')
        .eq('config_id', effectiveConfigId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[ProjectConfigService] ❌ Supabase error:', error);
        throw new Error(`Failed to fetch configuration: ${error.message}`);
      }

      if (!data) {
        console.warn(`[ProjectConfigService] ⚠️  Configuration not found: ${effectiveConfigId}, using fallback`);
        console.log('[ProjectConfigService] ═══════════════════════════════════════════');
        return this.getFallbackConfig();
      }

      this.cache.set(cacheKey, {
        data: data as ProjectConfiguration,
        timestamp: Date.now(),
      });

      console.log(`[ProjectConfigService] ✓ config_id-based configuration loaded and cached: ${effectiveConfigId}`);
      console.log('[ProjectConfigService] ═══════════════════════════════════════════');
      return data as ProjectConfiguration;
    } catch (error) {
      console.error('[ProjectConfigService] ❌ Error loading configuration:', error);
      console.log('[ProjectConfigService] 🔄 Returning fallback configuration');
      console.log('[ProjectConfigService] ═══════════════════════════════════════════');
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

  clearSpecificCache(identifier: string, isDomain: boolean = false): void {
    const cacheKey = this.getCacheKey(identifier, isDomain);
    this.cache.delete(cacheKey);
    console.log(`[ProjectConfigService] Cache cleared for: ${identifier} (${isDomain ? 'domain' : 'config_id'})`);
  }

  async refreshConfiguration(configId?: string): Promise<ProjectConfiguration> {
    const detectedDomain = getCurrentDomain();

    if (detectedDomain) {
      this.clearSpecificCache(detectedDomain, true);
    }

    if (configId) {
      this.clearSpecificCache(configId, false);
    } else {
      const effectiveConfigId = import.meta.env.VITE_PROJECT_CONFIG_ID || 'default';
      this.clearSpecificCache(effectiveConfigId, false);
    }

    return this.getProjectConfiguration(configId);
  }
}

export const projectConfigService = new ProjectConfigService();
