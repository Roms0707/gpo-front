import { TailwindColorPalette, ColorShade } from '../types/projectConfig';
import { colorShadeGenerator } from './colorShadeGenerator';

export const tailwindColorService = {
  buildTailwindPalette(primaryColor: string, secondaryColor: string): TailwindColorPalette {
    console.log('[TailwindColorService] Building palette from:', { primaryColor, secondaryColor });

    if (!colorShadeGenerator.validateHexColor(primaryColor)) {
      console.warn('[TailwindColorService] Invalid primary color, using fallback');
      primaryColor = '#FF6B00';
    }

    if (!colorShadeGenerator.validateHexColor(secondaryColor)) {
      console.warn('[TailwindColorService] Invalid secondary color, using fallback');
      secondaryColor = '#000000';
    }

    const palette: TailwindColorPalette = {
      primary: colorShadeGenerator.generateColorShades(primaryColor),
      secondary: colorShadeGenerator.generateColorShades(secondaryColor),
      accent: colorShadeGenerator.generateColorShades(primaryColor),
      success: colorShadeGenerator.generateColorShades('#22c55e'),
      warning: colorShadeGenerator.generateColorShades('#f59e0b'),
      error: colorShadeGenerator.generateColorShades('#ef4444'),
      info: colorShadeGenerator.generateColorShades('#3b82f6'),
    };

    console.log('[TailwindColorService] Palette generated with', Object.keys(palette).length, 'colors');
    return palette;
  },

  applyTailwindColors(palette: TailwindColorPalette): void {
    console.log('[TailwindColorService] Applying Tailwind colors to document');
    const root = document.documentElement;

    Object.entries(palette).forEach(([colorName, shades]) => {
      Object.entries(shades).forEach(([shade, hexValue]) => {
        const varName = `--color-${colorName}-${shade}`;
        root.style.setProperty(varName, hexValue);
      });
    });

    root.style.setProperty('--color-primary', palette.primary[500]);
    root.style.setProperty('--color-secondary', palette.secondary[500]);
    root.style.setProperty('--color-accent', palette.accent[500]);
    root.style.setProperty('--color-success', palette.success[500]);
    root.style.setProperty('--color-warning', palette.warning[500]);
    root.style.setProperty('--color-error', palette.error[500]);
    root.style.setProperty('--color-info', palette.info[500]);

    const isDark = this.isColorDark(palette.primary[500]);
    root.style.setProperty('--color-scheme', isDark ? 'dark' : 'light');

    console.log('[TailwindColorService] ✓ All Tailwind color variables applied');
  },

  isColorDark(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  },

  validateColorFormat(color: string): boolean {
    return colorShadeGenerator.validateHexColor(color);
  },
};
