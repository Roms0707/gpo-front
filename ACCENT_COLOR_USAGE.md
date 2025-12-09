# Accent Color Feature - Usage Guide

## Overview

The accent color feature allows project configurations to define an optional third brand color for enhanced visual design flexibility. This color is automatically integrated into the Tailwind CSS palette and available throughout the application.

## Database Field

- **Field**: `accent_color`
- **Type**: `text` (nullable)
- **Format**: Hex color code (`#RRGGBB`)
- **Default**: `null` (not set)

## Frontend Integration

### 1. Accessing the Accent Color

The accent color is available through the `useAppConfig` hook:

```tsx
import { useAppConfig } from '../contexts/AppConfigContext';

function MyComponent() {
  const { accentColor, primaryColor, secondaryColor } = useAppConfig();

  // accentColor will be null if not set in configuration
  const hasAccent = accentColor !== null;

  return (
    <div style={{ color: accentColor || primaryColor }}>
      Content with accent or fallback to primary
    </div>
  );
}
```

### 2. Using Tailwind Classes

The accent color is automatically available in the Tailwind palette with all shade levels:

```tsx
// Text colors
<span className="text-accent-500">Accent text</span>
<span className="text-accent-600">Darker accent text</span>

// Background colors
<div className="bg-accent-100">Light accent background</div>
<div className="bg-accent-500">Medium accent background</div>

// Border colors
<div className="border border-accent-400">Accent border</div>

// Hover states
<button className="hover:bg-accent-200 hover:text-accent-700">
  Hover me
</button>
```

### 3. Using CSS Custom Properties

The accent color is available as CSS variables:

```css
/* Base accent color (500 shade) */
color: var(--color-accent);

/* Specific shades */
background-color: var(--color-accent-100);
border-color: var(--color-accent-500);
```

### 4. Dynamic Inline Styles with Opacity

For opacity effects, use the raw accent color value:

```tsx
function AccentComponent() {
  const { accentColor, primaryColor } = useAppConfig();
  const color = accentColor || primaryColor;

  return (
    <>
      {/* 50% opacity */}
      <div style={{ backgroundColor: `${color}80` }}>
        Semi-transparent accent
      </div>

      {/* 20% opacity */}
      <div style={{ backgroundColor: `${color}33` }}>
        Subtle tint
      </div>
    </>
  );
}
```

## Fallback Strategy

The system implements a robust fallback chain:

1. **Custom Accent Color**: If `accent_color` is set and valid, it's used
2. **Primary Color Fallback**: If `accent_color` is `null`, the primary color is used
3. **System Default**: If all else fails, hardcoded fallback (`#FF6B00`)

This ensures the application always has a valid accent color, even when none is explicitly configured.

## How It Works

### Color Palette Generation

The `tailwindColorService` generates a complete color palette with 11 shades for each color:

- **50**: Lightest (95% lighter)
- **100-400**: Progressively darker light shades
- **500**: Base color (the hex value provided)
- **600-900**: Progressively darker shades
- **950**: Darkest (80% darker)

### Example Configuration Response

```json
{
  "config_id": "example",
  "brand_name": "My Arena",
  "primary_color": "#FF6B00",
  "secondary_color": "#000000",
  "accent_color": "#1E90FF"  // or null if not set
}
```

## Common Use Cases

### 1. Interactive Elements

```tsx
<button className="bg-primary-500 hover:bg-accent-500 text-white">
  Click me
</button>
```

### 2. Links

```tsx
<a href="#" className="text-accent-600 hover:text-accent-700 underline">
  Learn more
</a>
```

### 3. Status Indicators

```tsx
<span className="bg-accent-100 text-accent-800 px-2 py-1 rounded">
  Active
</span>
```

### 4. Subtle Backgrounds

```tsx
function Card() {
  const { accentColor } = useAppConfig();

  return (
    <div style={{ backgroundColor: accentColor ? `${accentColor}10` : undefined }}
         className={!accentColor ? 'bg-gray-50' : ''}>
      Card content
    </div>
  );
}
```

## Validation

- All accent colors are validated for proper hex format before use
- Invalid colors trigger a fallback to the primary color
- Console warnings are logged when invalid colors are detected

## Backward Compatibility

This feature is fully backward compatible:

- Existing configurations without `accent_color` continue to work
- The accent palette defaults to primary color shades (original behavior)
- No changes required to existing components
- Components using `accent-{shade}` classes automatically benefit when accent colors are added

## Console Logging

The system provides detailed logging for debugging:

```
[TailwindColorService] Building palette from: {
  primaryColor: "#FF6B00",
  secondaryColor: "#000000",
  accentColor: "#1E90FF"
}
[TailwindColorService] Using custom accent color: #1E90FF
```

Or when not set:

```
[TailwindColorService] No valid accent color provided, falling back to primary color
```

## Best Practices

1. **Check for null**: Always handle the case where `accentColor` is `null`
2. **Use fallbacks**: Provide sensible fallback colors (usually primary or secondary)
3. **Consistent opacity**: Use standard opacity values (10%, 20%, 50%, 80%)
4. **Semantic usage**: Use accent colors for emphasis, calls-to-action, and interactive elements
5. **Contrast**: Ensure sufficient contrast between accent and background colors

## Type Definitions

```typescript
interface ProjectConfiguration {
  // ... other fields
  primary_color: string;
  secondary_color: string;
  accent_color?: string | null;  // Optional accent color
}

interface AppConfigContextState {
  // ... other fields
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;  // Nullable accent color
}
```
