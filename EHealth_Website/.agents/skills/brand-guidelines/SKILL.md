---
name: brand-guidelines
description: Apply consistent brand colors, typography, and styling to any project or artifact. Use this skill when brand colors, style guidelines, visual formatting, or company design standards need to be applied to web pages, documents, or interfaces. Customizable for any brand identity.
---

# Brand Styling Skill

## Overview

Apply consistent brand identity and styling to any project. This skill helps maintain visual consistency across all outputs.

## How to Use

### Step 1: Define or Load Brand Guidelines
Either use the defaults below or ask the user for their brand specifics:
- **Logo** and brand mark usage
- **Color palette** (primary, secondary, accent colors with hex codes)
- **Typography** (heading and body fonts)
- **Spacing and sizing** conventions
- **Tone and voice** guidelines

### Step 2: Apply to Project
Generate CSS variables, update stylesheets, or apply directly to components.

## Default Brand Template

### Colors

**Primary Palette:**
- Dark/Primary: `#141413` — Primary text and dark backgrounds
- Light/Background: `#faf9f5` — Light backgrounds and text on dark
- Mid Gray: `#b0aea5` — Secondary elements, borders
- Light Gray: `#e8e6dc` — Subtle backgrounds, cards

**Accent Colors:**
- Primary Accent: `#d97757` — CTAs, highlights, interactive elements
- Secondary Accent: `#6a9bcc` — Links, secondary actions
- Tertiary Accent: `#788c5d` — Success states, positive indicators

### Typography

- **Headings**: Poppins (with Arial fallback)
- **Body Text**: Lora (with Georgia fallback)

### CSS Variables Template

```css
:root {
  /* Brand Colors */
  --brand-dark: #141413;
  --brand-light: #faf9f5;
  --brand-gray: #b0aea5;
  --brand-gray-light: #e8e6dc;
  --brand-accent-primary: #d97757;
  --brand-accent-secondary: #6a9bcc;
  --brand-accent-tertiary: #788c5d;
  
  /* Typography */
  --font-heading: 'Poppins', Arial, sans-serif;
  --font-body: 'Lora', Georgia, serif;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

### Google Fonts Import
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Customizing for Your Brand

To customize this skill for a specific brand:

1. **Replace the color palette** with your brand colors
2. **Update typography** with your brand fonts
3. **Adjust spacing** to match your design system
4. **Add brand-specific components** (button styles, card designs, etc.)

### Example: Updating for a Healthcare Brand

```css
:root {
  --brand-dark: #1a2332;
  --brand-light: #f8f9fa;
  --brand-primary: #0ea5e9;
  --brand-secondary: #10b981;
  --brand-accent: #f59e0b;
  
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Open Sans', sans-serif;
}
```

## Application Rules

### Text Styling
- Headings (h1-h3): Use heading font, bold weight
- Body text: Use body font, regular weight
- Ensure readable font sizes (min 16px body text)

### Color Application
- Use dark color for text on light backgrounds
- Use light color for text on dark backgrounds
- Use accent colors sparingly for emphasis and interaction
- Maintain WCAG AA contrast ratios (4.5:1 for normal text)

### Component Styling
- Buttons: Primary accent background, light text
- Cards: Light background, subtle border or shadow
- Links: Secondary accent color
- Success/Error: Use appropriate semantic colors
- Hover states: Slightly darker/lighter shade of the base color

## Best Practices
- **Consistency**: Apply the same styles everywhere — no one-off colors
- **Accessibility**: Always check contrast ratios
- **Fallbacks**: Provide system font fallbacks
- **Dark mode**: Consider providing a dark variant of the palette
- **Documentation**: When applying brand to a project, document the variables used
