export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  backgroundLight: string;
  backgroundDark: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const themeService = {
  generateCSSVariables(colors: ThemeColors): void {
    const root = document.documentElement;

    console.log('[ThemeService] Generating CSS variables with color shades');

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-background-light', colors.backgroundLight);
    root.style.setProperty('--color-background-dark', colors.backgroundDark);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);

    this.generateColorShades('primary', colors.primary, root);
    this.generateColorShades('secondary', colors.secondary, root);
    this.generateColorShades('accent', colors.accent, root);
    this.generateColorShades('success', colors.success, root);
    this.generateColorShades('warning', colors.warning, root);
    this.generateColorShades('error', colors.error, root);
    this.generateColorShades('info', colors.info, root);

    const isDark = this.isColorDark(colors.background);
    root.style.setProperty('--color-scheme', isDark ? 'dark' : 'light');

    console.log('[ThemeService] ✓ CSS variables and color shades generated:', {
      '--color-primary': colors.primary,
      '--color-accent': colors.accent,
      '--color-secondary': colors.secondary,
      totalVariablesSet: 14 + (7 * 11)
    });
  },

  generateColorShades(colorName: string, baseColor: string, root: HTMLElement): void {
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const percentages = [95, 90, 80, 60, 30, 0, -20, -40, -55, -70, -80];

    shades.forEach((shade, index) => {
      const percentage = percentages[index];
      let shadeColor: string;

      if (percentage > 0) {
        shadeColor = this.lightenColor(baseColor, percentage);
      } else if (percentage < 0) {
        shadeColor = this.darkenColor(baseColor, Math.abs(percentage));
      } else {
        shadeColor = baseColor;
      }

      root.style.setProperty(`--color-${colorName}-${shade}`, shadeColor);
    });
  },

  convertToCSSVariableName(key: string): string {
    const kebabCase = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `--color-${kebabCase}`;
  },

  isColorDark(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  },

  transitionTheme(fromColors: ThemeColors, toColors: ThemeColors, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      const root = document.documentElement;
      root.style.setProperty('transition', `all ${duration}ms ease-in-out`);

      this.generateCSSVariables(toColors);

      setTimeout(() => {
        root.style.removeProperty('transition');
        resolve();
      }, duration);
    });
  },


  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  lightenColor(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * (percent / 100)));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * (percent / 100)));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * (percent / 100)));

    return this.rgbToHex(r, g, b);
  },

  darkenColor(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.max(0, Math.floor(rgb.r * (1 - percent / 100)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - percent / 100)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - percent / 100)));

    return this.rgbToHex(r, g, b);
  },
};
