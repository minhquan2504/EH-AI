---
name: algorithmic-art
description: Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. Create original algorithmic art rather than copying existing artists' work.
---

Algorithmic philosophies are computational aesthetic movements expressed through code. Output .md files (philosophy) and .html files (interactive generative art).

This happens in two steps:
1. Algorithmic Philosophy Creation (.md file)
2. Express by creating p5.js generative art (.html file)

## ALGORITHMIC PHILOSOPHY CREATION

To begin, create an ALGORITHMIC PHILOSOPHY (not static images or templates) that will be interpreted through:
- Computational processes, emergent behavior, mathematical beauty
- Seeded randomness, noise fields, organic systems
- Particles, flows, fields, forces
- Parametric variation and controlled chaos

### THE CRITICAL UNDERSTANDING
- What is received: Some subtle input or instructions by the user
- What is created: An algorithmic philosophy/generative aesthetic movement
- What happens next: The philosophy is EXPRESSED IN CODE — creating p5.js sketches that are 90% algorithmic generation, 10% essential parameters

### HOW TO GENERATE AN ALGORITHMIC PHILOSOPHY
**Name the movement** (1-2 words): "Organic Turbulence" / "Quantum Harmonics" / "Emergent Stillness"

**Articulate the philosophy** (4-6 paragraphs):
Express how this philosophy manifests through:
- Computational processes and mathematical relationships
- Noise functions and randomness patterns
- Particle behaviors and field dynamics
- Temporal evolution and system states
- Parametric variation and emergent complexity

**CRITICAL GUIDELINES:**
- **Avoid redundancy**: Each algorithmic aspect mentioned once
- **Emphasize craftsmanship**: The algorithm should appear meticulously crafted, refined with care, the product of deep computational expertise
- **Leave creative space**: Be specific about direction, but concise enough for creative implementation

### PHILOSOPHY EXAMPLES

**"Organic Turbulence"**
Flow fields driven by layered Perlin noise. Thousands of particles following vector forces, trails accumulating into organic density maps. Color emerges from velocity and density.

**"Quantum Harmonics"**
Particles on a grid carrying phase values that evolve through sine waves. Phase interference creates bright nodes and voids. Simple harmonic motion generates complex emergent mandalas.

**"Field Dynamics"**
Vector fields from mathematical functions or noise. Particles born at edges, flowing along field lines, dying at boundaries. Visualization shows only traces — ghost-like evidence of invisible forces.

### ESSENTIAL PRINCIPLES
- **PROCESS OVER PRODUCT**: Beauty emerges from the algorithm's execution
- **PARAMETRIC EXPRESSION**: Ideas communicate through mathematical relationships
- **ARTISTIC FREEDOM**: Provide creative implementation room
- **EXPERT CRAFTSMANSHIP**: The algorithm must feel meticulously crafted

---

## P5.JS IMPLEMENTATION

### TECHNICAL REQUIREMENTS

**Seeded Randomness (Art Blocks Pattern):**
```javascript
let seed = 12345;
randomSeed(seed);
noiseSeed(seed);
```

**Parameter Structure:**
```javascript
let params = {
  seed: 12345,
  // Add parameters that control YOUR algorithm:
  // Quantities, Scales, Probabilities, Ratios, Angles, Thresholds
};
```

**Canvas Setup:**
```javascript
function setup() {
  createCanvas(1200, 1200);
}

function draw() {
  // Your generative algorithm
}
```

### CRAFTSMANSHIP REQUIREMENTS
- **Balance**: Complexity without visual noise, order without rigidity
- **Color Harmony**: Thoughtful palettes, not random RGB values
- **Composition**: Even in randomness, maintain visual hierarchy and flow
- **Performance**: Smooth execution, optimized for real-time if animated
- **Reproducibility**: Same seed ALWAYS produces identical output

### OUTPUT FORMAT

Create a **single self-contained HTML file** with:
1. p5.js loaded from CDN
2. All code inline
3. Parameter controls (sliders, color pickers)
4. Seed navigation (prev/next/random/jump)
5. Download PNG button

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
  <style>/* All styling inline */</style>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="controls"><!-- Parameter controls --></div>
  <script>
    // ALL p5.js code inline
    // Parameters, classes, setup(), draw()
    // UI handlers — everything self-contained
  </script>
</body>
</html>
```

### REQUIRED FEATURES
1. **Parameter Controls**: Sliders for numeric params, real-time updates, reset button
2. **Seed Navigation**: Display seed, prev/next/random buttons, jump-to input
3. **Actions**: Regenerate, Reset, Download PNG

### INTERACTIVE VIEWER
The HTML file works immediately:
- Open in any browser — no server needed
- Completely self-contained
- Use `browser_subagent` to preview and validate the art

---

## THE CREATIVE PROCESS

**User request** → **Algorithmic philosophy** → **Implementation**

1. **Interpret** the user's intent
2. **Create** an algorithmic philosophy (4-6 paragraphs)
3. **Implement** the algorithm in p5.js
4. **Design** appropriate tunable parameters
5. **Build** matching UI controls
6. **Preview** with `browser_subagent` to verify the result
