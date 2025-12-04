import { ColorShade } from '../types/projectConfig';

export const colorShadeGenerator = {
  generateColorShades(baseColor: string): ColorShade {
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
    const percentages = [95, 90, 80, 60, 30, 0, -20, -40, -55, -70, -80];

    const result = {} as ColorShade;

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

      result[shade] = shadeColor;
    });

    return result;
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

  validateHexColor(color: string): boolean {
    return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(color);
  },
};
