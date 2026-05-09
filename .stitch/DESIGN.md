# Design System: JSW Paint Studio

## 1. Visual Theme & Atmosphere
A highly refined, premium architectural interface with cinematic depth and fluid spring-physics motion. The atmosphere is professional yet immersive — like a high-end interior design studio at dusk. Density is balanced (5), variance is elegantly asymmetric (6), and motion is cinematic but restrained (7). The design heavily features glassmorphism (frosted glass) elements overlaying hyper-realistic 3D spaces, providing a tactile, "next-generation" feel that instills absolute confidence in the visualizer's accuracy.

## 2. Color Palette & Roles
- **Canvas Navy** (#0F172A) — Primary background surface and deep dark mode bases
- **Pure Surface** (#FFFFFF) — Text on dark backgrounds and card fills in light mode
- **Charcoal Ink** (#020617) — Primary text on light surfaces, maximum contrast
- **Muted Steel** (#475569) — Secondary text, descriptions, inactive states
- **Whisper Border** (rgba(255,255,255,0.15)) — Glass panel borders, subtle structural lines
- **Precision Blue** (#0369A1) — Single accent for CTAs, gradient text highlights, active states
*(Max 1 accent. Saturation < 80%. No purple/neon. No pure black.)*

## 3. Typography Rules
- **Display:** Poppins — Track-tight, controlled scale, weight-driven hierarchy. Used for all H1-H6 headlines.
- **Body:** Open Sans — Relaxed leading, 65ch max-width, neutral secondary color. Highly legible for dense application interfaces.
- **Mono:** JetBrains Mono — For hex codes, dimension measurements, and visualizer coordinates.
- **Banned:** Inter, generic system fonts for premium contexts. Serif fonts are strictly banned across the entire dashboard and visualizer.

## 4. Component Stylings
* **Buttons:** Fully rounded (pill shape). Tactile scale down (`scale-98`) on active state. Precision Blue fill for primary, glass/frosted (`bg-white/10` with blur) for secondary. No outer glows.
* **Cards (Glass Panels):** Generously rounded corners (`2rem` to `2.5rem`). Frosted glass effect (`backdrop-blur-xl`) with a 1px solid Whisper Border. Diffused shadow. Used specifically to float UI elements over 3D background renders.
* **Inputs:** Label above, error below. Focus ring in Precision Blue. Subtle dark background fill (`bg-slate-800/50`).
* **Loaders:** Skeletal shimmer matching exact layout dimensions. No circular spinners.
* **Empty States:** Composed, beautifully lit 3D room illustrations indicating how to upload a photo.

## 5. Layout Principles
Grid-first responsive architecture. Full-width, cinematic edge-to-edge Hero sections. Asymmetric splits (e.g., 40/60) for feature descriptions alongside visual assets.
Strict single-column collapse below 768px. Max-width containment (`max-w-7xl`) for text content overlaying full-width images.
No flexbox percentage math. No overlapping text on generic backgrounds (always use a gradient overlay for contrast).

## 6. Motion & Interaction
Spring physics for all interactive elements (buttons, cards on hover). Staggered cascade reveals on scroll (opacity + Y-axis translate).
Perpetual micro-loops on active 3D elements (e.g., extremely slow 15s zoom on background renders). Hardware-accelerated transforms only.

## 7. Anti-Patterns (Banned)
* NEVER DO: Emojis anywhere in the UI.
* NEVER DO: Inter font.
* NEVER DO: Pure black (`#000000`).
* NEVER DO: Neon/outer glow shadows.
* NEVER DO: 3-column equal card layouts for feature lists (use offset grids or glass panels).
* NEVER DO: AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen").
* NEVER DO: Generic placeholder names or fake performance metrics ("99.98% Accuracy" unless verified).
* NEVER DO: Overlapping text directly on busy images without a protective gradient mask.
