---
name: theme-factory
description: Toolkit for styling web pages, documents, and interfaces with professional themes. Provides 10 pre-set themes with curated color palettes and font pairings. Use when the user wants to apply a theme, style a UI, or needs a cohesive color/font system for any project.
---

# Theme Factory Skill

This skill provides a curated collection of professional color and font themes. Choose a theme and apply it consistently to any project — web pages, documents, presentations, or interfaces.

## Purpose

Apply consistent, professional styling with:
- A cohesive color palette with hex codes
- Complementary font pairings (Google Fonts) for headers and body text
- A distinct visual identity suitable for different contexts

## Usage Instructions

1. **Present available themes** to the user (see list below)
2. **Ask for their choice** or requirements for a custom theme
3. **Apply the theme** — generate CSS variables, update stylesheets, or apply to components

## Available Themes

### 1. 🌊 Ocean Depths
**Mood**: Professional, calming, trustworthy
- **Colors**: `#0a1628` (deep navy), `#1a3a5c` (ocean blue), `#2d8cf0` (bright blue), `#64b5f6` (sky), `#e3f2fd` (foam white)
- **Accent**: `#00bcd4` (teal)
- **Fonts**: Heading: `Outfit`, Body: `Source Sans 3`

### 2. 🌅 Sunset Boulevard
**Mood**: Warm, vibrant, energetic
- **Colors**: `#1a0a2e` (deep purple), `#d4451a` (burnt orange), `#ff6b35` (sunset orange), `#ffa726` (warm gold), `#fff3e0` (cream)
- **Accent**: `#e91e63` (magenta)
- **Fonts**: Heading: `Playfair Display`, Body: `Raleway`

### 3. 🌿 Forest Canopy
**Mood**: Natural, grounded, organic
- **Colors**: `#1b2820` (forest dark), `#2e5339` (deep green), `#4caf50` (leaf green), `#81c784` (light green), `#e8f5e9` (mint white)
- **Accent**: `#8d6e63` (bark brown)
- **Fonts**: Heading: `Merriweather`, Body: `Open Sans`

### 4. ⚪ Modern Minimalist
**Mood**: Clean, contemporary, sophisticated
- **Colors**: `#111111` (near black), `#333333` (dark gray), `#888888` (mid gray), `#cccccc` (light gray), `#fafafa` (off-white)
- **Accent**: `#2196f3` (minimal blue)
- **Fonts**: Heading: `DM Sans`, Body: `IBM Plex Sans`

### 5. 🌾 Golden Hour
**Mood**: Rich, warm, autumnal
- **Colors**: `#2c1810` (dark chocolate), `#6d4c2a` (caramel), `#c49a4a` (gold), `#e6c87a` (wheat), `#fdf6e3` (parchment)
- **Accent**: `#d84315` (amber red)
- **Fonts**: Heading: `Cormorant Garamond`, Body: `Lato`

### 6. ❄️ Arctic Frost
**Mood**: Cool, crisp, modern
- **Colors**: `#0d1b2a` (arctic night), `#1b3a4b` (ice blue), `#468faf` (frost), `#a2d2ff` (ice), `#f0f8ff` (snow white)
- **Accent**: `#62b6cb` (glacier)
- **Fonts**: Heading: `Josefin Sans`, Body: `Nunito`

### 7. 🌹 Desert Rose
**Mood**: Soft, sophisticated, elegant
- **Colors**: `#3d2c2e` (dark rose), `#7b4b5a` (dusty rose), `#c48b9f` (rose), `#e8b4b8` (blush), `#fdf2f4` (rose white)
- **Accent**: `#c9a96e` (sand gold)
- **Fonts**: Heading: `Libre Baskerville`, Body: `Karla`

### 8. 💡 Tech Innovation
**Mood**: Bold, modern, futuristic
- **Colors**: `#0a0e17` (void), `#141e30` (dark tech), `#00d4ff` (neon cyan), `#7c4dff` (electric purple), `#e8eaf6` (tech white)
- **Accent**: `#00e676` (matrix green)
- **Fonts**: Heading: `Space Grotesk`, Body: `JetBrains Mono`

### 9. 🌺 Botanical Garden
**Mood**: Fresh, organic, lively
- **Colors**: `#1a2f1a` (garden dark), `#2d5a27` (deep leaf), `#66bb6a` (garden green), `#aed581` (spring), `#f1f8e9` (garden white)
- **Accent**: `#ff7043` (flower orange)
- **Fonts**: Heading: `Fraunces`, Body: `Work Sans`

### 10. 🌌 Midnight Galaxy
**Mood**: Dramatic, cosmic, luxurious
- **Colors**: `#0b0c1e` (void black), `#1a1b3d` (deep space), `#4a148c` (nebula purple), `#7c43bd` (galaxy violet), `#e8e0f0` (starlight)
- **Accent**: `#ffd54f` (star gold)
- **Fonts**: Heading: `Sora`, Body: `Inter`

## Applying a Theme

### As CSS Variables
```css
:root {
  /* Colors */
  --color-bg-primary: [darkest];
  --color-bg-secondary: [dark];
  --color-primary: [main];
  --color-primary-light: [light];
  --color-bg-light: [lightest];
  --color-accent: [accent];
  
  /* Typography */
  --font-heading: '[Heading Font]', sans-serif;
  --font-body: '[Body Font]', sans-serif;
}
```

### Google Fonts Import
```html
<link href="https://fonts.googleapis.com/css2?family=[Heading+Font]:wght@400;600;700&family=[Body+Font]:wght@300;400;500;600&display=swap" rel="stylesheet">
```

## Create Your Own Theme

If no existing theme fits, create a custom one:
1. Ask the user for mood/vibe keywords
2. Generate a 5-color palette (dark → light gradient)
3. Choose an accent color for interactive elements
4. Select complementary Google Fonts pair
5. Present for approval, then apply

### Custom Theme Guidelines
- **Contrast**: Ensure WCAG AA compliance between text and backgrounds
- **Harmony**: Use analogous or complementary color relationships
- **Font pairing**: Contrast heading and body fonts (serif + sans-serif, or display + neutral)
- **Consistency**: Apply the theme uniformly across all components
