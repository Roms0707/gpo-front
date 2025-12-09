export interface ColorShade {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface TailwindColorPalette {
  primary: ColorShade;
  secondary: ColorShade;
  accent: ColorShade;
  success: ColorShade;
  warning: ColorShade;
  error: ColorShade;
  info: ColorShade;
}

export interface LegalVariables {
  support_email: string | null;
  legal_email: string | null;
  privacy_email: string | null;
  company_name: string | null;
  company_address: string | null;
  phone_number: string | null;
  registration_number: string | null;
}

export interface ProjectConfiguration {
  id: string;
  config_id: string;
  config_name: string;
  is_active: boolean;
  brand_name: string;
  logo_path: string;
  favicon_path: string;
  logo_alt_text: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string | null;
  product_id: string | null;
  campaign_id: string | null;
  domain?: string;
  extra_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  support_email?: string | null;
  legal_email?: string | null;
  privacy_email?: string | null;
  company_name?: string | null;
  company_address?: string | null;
  phone_number?: string | null;
  registration_number?: string | null;
}

export interface AppConfigContextState {
  configId: string;
  configName: string;
  brandName: string;
  logo: string;
  favicon: string;
  logoAltText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  productId: string | null;
  campaignId: string | null;
  tailwindPalette: TailwindColorPalette | null;
  legalVariables: LegalVariables;
  isLoading: boolean;
  refreshConfiguration: () => Promise<void>;
}
