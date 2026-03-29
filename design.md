# Plugin Base — Design System
> **Stack:** React · TypeScript · Tailwind CSS · Framer Motion  
> **Philosophy:** Warm, editorial, restrained. Every decision earns its place.

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography](#2-typography)
3. [Spacing & Shadow Tokens](#3-spacing--shadow-tokens)
4. [Animation & Motion](#4-animation--motion)
5. [SVG Construction](#5-svg-construction)
6. [Page Architecture](#6-page-architecture)
7. [Section Anatomy & Storytelling](#7-section-anatomy--storytelling)
8. [Component Patterns](#8-component-patterns)
9. [The 10 Rules](#9-the-10-rules)

---

## 1. Color System

> Palette references parchment, ink, burnished gold, and aged bronze — materials of precision and permanence. **Zero blue. Zero purple. Zero generic SaaS color.** Only two semantic colors exist outside this palette: `#10b981` (emerald) for status/success, and `#EAB564` (gold) as the single accent.

> **Rule:** All colors use Tailwind bracket notation only — never Tailwind preset names. `text-[#1A1714]` not `text-gray-900`.

| Token | Hex | Role | Used In |
|---|---|---|---|
| **Parchment** | `#F7F4EF` | Primary Background | Hero, Features, Social Proof — warm off-white like fine paper |
| **Ink** | `#1A1714` | Primary Foreground | Headings, CTAs, nav backgrounds, dark card backgrounds |
| **Gold** | `#EAB564` | Brand Accent | Logo highlight, CTA buttons, active states, underline SVG, cursor dot |
| **Amber Mid** | `#D4924A` | Accent Variant | SVG cube faces, gradient stops, hover states |
| **Bronze** | `#C87A38` | Accent Dark | Deeper SVG faces, pressed states |
| **Sienna** | `#9B7B4E` | Muted Accent | Eyebrow labels, dividers, secondary links, idle icon color |
| **Warm Tan** | `#C4B49A` | Subdued Text | Footer text, secondary body copy on dark backgrounds |
| **Smoke** | `#5C5448` | Body Text | Primary body text, nav links, subtitle copy on light bg |
| **Ash** | `#8C7B68` | Tertiary Text | Captions, timestamps, placeholder copy |
| **Cream Border** | `#E2D9CC` | Border / Divider | Card borders, divider lines, input borders on light sections |
| **Dark Floor** | `#111009` | Dark Section BG | HowItWorks section — deepest near-black with warm undertone |
| **Abyss** | `#0A0908` | Footer BG | Footer background — absolute darkest, warmer than pure black |
| **Sage / Emerald** | `#10b981` | Semantic: Success | Status dot, savings badge, check icons, "All systems" badge |
| **Linen** | `#F0EAE0` | Alt Light BG | Pricing section — slightly more saturated warm off-white |

### Page Background Rhythm

```
Parchment → Ink → Parchment → Dark Floor → Parchment → Linen → Ink → Abyss
  Hero    → TrustedBy → Features → HowItWorks → SocialProof → Pricing → CTA → Footer
```

Sections alternate light/dark to reset the eye and create visual rhythm.

---

## 2. Typography

> **Two-font system only.** Georgia serif for all headings — editorial gravity, anti-generic. System sans (`Inter` / `system-ui`) for all body/UI — neutral, readable.

| Style | Font | Size | Weight | Used For |
|---|---|---|---|---|
| Display / H1 | `Georgia, serif` | `clamp(3rem, 8vw, 6.5rem)` | **900 (Black)** | Hero headline |
| Section Heading / H2 | `Georgia, serif` | `3rem – 4rem` | **900 (Black)** | Section openers |
| Dark H2 (XL) | `Georgia, serif` | `3rem – 4.5rem` | **900 (Black)** | CTA / dark section H2 |
| Card H3 | `Georgia, serif` | `1.875rem` | **900 (Black)** | Feature card titles |
| Eyebrow Label | `system-ui / Inter` | `0.75rem` | 700 (Bold) | Section labels, tags |
| Body Regular | `system-ui / Inter` | `1rem` | 400 (Regular) | Paragraphs, descriptions |
| Body Large | `system-ui / Inter` | `1.125rem – 1.25rem` | 400 (Regular) | Hero subtext, callouts |
| Micro / Badge | `system-ui / Inter` | `0.625rem` | 700 (Bold) | Badges, compliance, version labels |

### Rules

- Headings: **always** `font-black` (900). Never `font-bold` for headings.
- Body: **always** `system-ui` / Inter. Never serif for body.
- Apply serif inline: `style={{ fontFamily: 'Georgia, serif' }}` — not a Tailwind class.

---

## 3. Spacing & Shadow Tokens

### Spacing Scale

| Token | Value | Role |
|---|---|---|
| `py-32` | 128px | Section vertical padding — all major sections |
| `py-36` | 144px | Section vertical padding — CTA and hero (extra emphasis) |
| `max-w-7xl mx-auto` | 1280px max | Content max width — all sections |
| `px-6` | 24px | Content side padding — works on mobile and desktop |
| `p-8` | 32px | Standard card interior padding |
| `p-10` | 40px | Dense card padding — feature panels, HowItWorks preview |
| `gap-6` | 24px | Grid gap — testimonials, pricing, feature cards |
| `gap-8 / gap-16` | 32–64px | Wide gap — feature layout, HowItWorks two-column |
| `gap-3 / gap-4` | 12–16px | Inline gap — icon+label pairs, pill items |
| `mb-20 / mb-24` | 80–96px | Section heading gap — space between header and content grid |

### Shadow Tokens

| Token | Value | Used On |
|---|---|---|
| Card Elevation | `shadow-2xl shadow-[#1A1714]/20` | Highlighted pricing card, dark modal cards |
| Hero Chat Card | `0 32px 80px rgba(26,23,20,0.14), 0 0 0 1px rgba(212,196,168,0.3)` | Floating chat preview widget |
| Feature Panel | `0 24px 80px rgba(26,23,20,0.08)` | Feature detail card — subtle, warm |
| Gold CTA Shadow | `shadow-2xl shadow-[#EAB564]/20` | Primary gold CTA button |
| Step Circle | `shadow-lg shadow-[#EAB564]/30` | Active step indicator — golden glow |

### Border Radius

| Value | Used On |
|---|---|
| `8px` / `rounded-lg` | Inputs |
| `16px` / `rounded-2xl` | Buttons |
| `24px` / `rounded-3xl` | Large cards |
| `9999px` / `rounded-full` | Pills, badges |

---

## 4. Animation & Motion

> **Philosophy:** Every animation earns its place. No decorative motion without purpose. Entry animations use `once: true` — fire once, never repeat. Interactions are immediate and physical via spring physics. Duration sweet spot: **0.35–0.75s**. Never over 1s except for page-load or infinite loops.

### Easing Tokens

| Name | Value | Used For |
|---|---|---|
| **House Ease** *(primary)* | `[0.22, 1, 0.36, 1]` | 80% of all motion — fast entry, long deceleration tail |
| Standard Ease | `easeOut` | Fallback for simpler reveals |
| Spring (Magnetic) | `{ stiffness: 200, damping: 20 }` | Magnetic button cursor tracking |
| Spring (Snappy) | `{ stiffness: 400, damping: 24 }` | Inner cursor dot — ultra-responsive |
| Spring (Floaty) | `{ stiffness: 40, damping: 14 }` | Cursor glow trail — slow, dreamy lag |
| Spring (Bounce) | `{ type: 'spring', stiffness: 200 }` | FAB button entry |

---

### 4.1 Entry Animations

#### Fade + Slide Up *(universal)*
The default entry for all scroll-revealed elements.
```jsx
initial={{ opacity: 0, y: 24 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.6 }}
```

#### Staggered Cascade *(lists)*
Items reveal in sequence — flowing waterfall without overwhelming.
```jsx
transition={{
  duration: 0.4,
  delay: i * 0.06   // 0.06 fast / 0.18 slow cascade
}}
```

#### Blur + Slide *(dramatic, process steps)*
Cinematic focus-pull effect. Pairs with x-translation.
```jsx
initial={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
```

#### Scale Bounce *(step indicators, icons)*
Overshoot then settle — creates an alive, physical feel.
```jsx
animate={{ scale: [0.6, 1.12, 1] }}
transition={{ duration: 0.5, ease: 'easeOut' }}
```

#### Text Mask Reveal *(section H2)*
Wrap in `overflow: hidden` — text rises out of the ground.
```jsx
// Parent: <div className="overflow-hidden">
initial={{ y: 60, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
```

---

### 4.2 Scroll Animations

#### Scroll Parallax *(hero + CTA)*
```jsx
const { scrollYProgress } = useScroll();
const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
// CTA glow: useTransform(scrollYProgress, [0.7, 1], [-40, 40])
```

#### Scroll-Driven Progress Line *(HowItWorks)*
Vertical line fills as user scrolls through section.
```jsx
const lineHeight = useTransform(
  scrollYProgress, [0.1, 0.7], ['0%', '100%']
);
// <motion.div style={{ height: lineHeight }} />
```

---

### 4.3 Interaction Animations

#### Magnetic Button Pull *(all primary CTAs)*
Spring physics cursor tracking — tactile, gravitational feel.
```jsx
const x = useMotionValue(0);
const sx = useSpring(x, { stiffness: 200, damping: 20 });
// onMouseMove: x.set((clientX - centerX) * 0.3)
// onMouseLeave: x.set(0)
```

#### Card Hover Flood Fill *(testimonial cards)*
Dark overlay floods from bottom — premium ink-wash effect.
```jsx
<motion.div
  className="absolute inset-0 bg-[#1A1714]"
  initial={{ scaleY: 0 }}
  whileHover={{ scaleY: 1 }}
  style={{ originY: 1 }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
/>
```

#### AnimatePresence Content Swap *(tabs, feature panels)*
Old content fades/slides out, new content fades/slides in.
```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeFeature}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.35 }}
  />
</AnimatePresence>
```

---

### 4.4 Delight Animations

#### Animated Number Counter *(metrics row)*
RAF loop, cubic ease-out, numbers roll up on enter.
```jsx
const ease = 1 - Math.pow(1 - progress, 3);
const current = target * ease;
setDisplay(Math.floor(current).toLocaleString());
// Trigger: useInView hook
```

#### Three-Layer Custom Cursor
Three DOM elements at `z-[9999]`. Different spring speeds create a spacious trail.
```
Outer ring  → stiffness: 120, damping: 18, mass: 0.8  (slow)
Inner dot   → stiffness: 500, damping: 28              (fast)
Glow trail  → stiffness: 40,  damping: 14              (very slow)
```
- **Hover state:** outer scales `2.2×`, inner scales `0.4×`
- **Click state:** outer `0.85×`, inner `1.6×`

#### Infinite Pulsing Beacon *(status dots)*
```jsx
animate={{ scale: [1, 1.5, 1] }}
transition={{ duration: 2, repeat: Infinity }}
// Also usable: opacity: [0.6, 1, 0.6]
```

#### Typing Indicator Dots *(chat bubble)*
```jsx
animate={{ y: [0, -4, 0] }}
transition={{
  duration: 0.8,
  repeat: Infinity,
  delay: i * 0.15   // i = 0, 1, 2
}}
```

---

## 5. SVG Construction

> **Rules:** All decorative SVG must have `aria-hidden="true"` and `pointer-events-none`. Max fill opacity: **0.35**. Think watermarks, not graphics. SVG backgrounds support content — they never compete. Use `preserveAspectRatio="xMidYMid slice"` to fill viewport responsively.

### Isometric Cube Cluster
Three polygons (top face, left face, right face) with `linearGradient` fills and thin low-opacity strokes.

```
Top face (lightest):   cx,y1  →  cx+r,cy  →  cx,cy+r  →  cx-r,cy   (diamond)
Left face (medium):    cx-r,cy  →  cx,cy+r  →  cx,h  →  cx-r,h-r
Right face (darkest):  cx,cy+r  →  cx+r,cy  →  cx+r,h-r  →  cx,h
```

- **On dark:** Gold `#EAB564`, Amber `#D4924A`, Bronze `#C87A38`
- **On light:** Steel sand tones at 0.06–0.35 opacity
- Render at 2–3 scales per section

### Dot Grid
Nested map of `<circle r="1–1.4">`. Opacity fades by row for perspective effect.

```jsx
opacity={0.18 - row * 0.018}  // light sections (fading grid)
opacity={0.07}                  // dark sections (flat grid)
cx={startX + col * spacing}
cy={startY + row * spacing}
```

- **On light:** Sienna `#9B7B4E`
- **On dark:** Gold `#EAB564`
- Hero: 8×10 grid. Dark sections: 12×20 grid.

### Diagonal Line Fan
4–6 parallel diagonal lines with `linearGradient` stroke (opacity 0.5 → 0) emanating from a corner.

```jsx
x1={startX + i * 50}  y1={0}
x2={maxX}              y2={maxY - i * 50}
// stroke: linearGradient from rgba(196,168,130,0.5) to transparent
```

### Radial Glow Orb
Large `<ellipse>` with `radialGradient` — soft luminous focal point behind content.

```jsx
// Gold on dark: #EAB564 at 0.12 center → transparent
// Single <ellipse cx="50%" cy="50%" rx="40%" ry="35%" />
```

### Bezier Curve Waves
Organic `<path>` using quadratic bezier (`Q` command) at bottom of hero for depth.

```
M 0 y1  Q midX midY endX y1
// Stack 2–3 paths with increasing amplitude
// Group opacity: 0.12
```

### Golden Gradient HR *(section transition)*
```css
background: linear-gradient(
  90deg,
  transparent 0%,
  #6B5B45 20%,
  #EAB564 50%,
  #6B5B45 80%,
  transparent 100%
);
height: 1px;
```

### SVG Underline Stroke *(hero key word)*
Hand-drawn underline under the hero's most important word. Full opacity — intentional decoration.

```jsx
<path
  d="M2 8 Q100 2 200 8 Q300 14 398 6"
  stroke="#EAB564"
  strokeWidth="3.5"
  strokeLinecap="round"
  fill="none"
/>
```

---

## 6. Page Architecture

### Section Order

| # | Section | Background | Job |
|---|---|---|---|
| 01 | **Hero** | `#F7F4EF` Parchment | Hook + product demo widget |
| 02 | **Trusted By** | `#1A1714` Ink | Social proof bridge band |
| 03 | **Features** | `#F7F4EF` Parchment | Interactive tab + detail panel |
| 04 | **How It Works** | `#111009` Dark Floor | Scroll-driven 3-step process |
| 05 | **Social Proof** | `#F7F4EF` Parchment | Metric counters + testimonials |
| 06 | **Pricing** | `#F0EAE0` Linen | Three-column with billing toggle |
| 07 | **CTA Strip** | `#1A1714` Ink | Final conversion, parallax glow |
| 08 | **Footer** | `#0A0908` Abyss | Newsletter + nav + compliance |

### Narrative Arc
```
Hook → Name Drop → Prove → Clarify → Validate → Convert → Act → Close
```

Each section has a **single job**. Single job. One CTA per section.

---

## 7. Section Anatomy & Storytelling

### 01 — Hero
**Job:** First impression / Hook

- Split layout: editorial left text + floating right UI card
- Text stagger reveals with 0.1s incremental delays
- H1 uses fluid `clamp()` sizing
- **SVGs:** Isometric cubes (2 sizes × 2 color families), diagonal ruled lines, dot grid (8×10), organic bezier curves at bottom — all ≤15% opacity
- **Motion:** `heroY` parallax on scroll, `motion.div` stagger per element, float animation on badge (`y: [0,-6,0]` 3s infinite), typing dots in chat bubble
- **Copy principle:** Problem → Solution in 2 lines. The chat preview widget IS the product demo.

### 02 — Trusted By
**Job:** Social proof tease / Bridge

- Dark band after light hero — stark visual contrast
- Logo names in plain text, no images — feels authentic not stock
- `whileHover`: color to `#EAB564`, y: -2
- No SVG — the intentional absence lets the dark bar breathe editorially
- **Copy principle:** Name-dropping without showboating.

### 03 — Features
**Job:** Capability proof

- Interactive tab list (left `lg:col-span-2`) + animated detail panel (right `lg:col-span-3`)
- `layoutId="featureTabBg"` for smooth indicator morphing
- Active state inverts colors completely
- **Motion:** `layoutId` shared layout for tab highlight, `AnimatePresence mode="wait"` for panel swap, staggered `x:-20` entry for tabs
- **Copy principle:** Title → Tag → Desc → Detail = 4 levels of progressive depth.

### 04 — How It Works
**Job:** Conversion clarifier

- Dark section breaks page rhythm — deliberate pattern break
- Vertical scroll-driven progress line fills as user reads
- Clicking steps swaps right-side preview panel
- **SVGs:** Radial glow ellipse, isometric cubes (amber palette), dot grid at 0.07 opacity
- **Motion:** `useScroll` target + `useTransform` for line height, blur+slide for step entry, scale-bounce for step circles
- **Copy principle:** Three steps maximum. Each step shows a mini mock UI. "Zero engineers needed" is the promise.

### 05 — Social Proof
**Job:** Trust + credibility

- Animated counter metrics row above testimonials
- Center card (#1 of 3) uses dark/gold inversion as visual hero
- Hover shimmer radial gradient
- **Motion:** `AnimatedCounter` (RAF loop + cubic ease), card hover flood fill (`scaleY: 0→1, originY: 1`)
- **Copy principle:** Metrics first, then words. Numbers convince — quotes humanize.

### 06 — Pricing
**Job:** Decision + conversion

- Three-column. Middle card: `scale-[1.03]` + `-top-4` badge
- `AnimatePresence` price number swap on billing toggle
- Magnetic buttons on all CTAs
- **Copy principle:** "Simple. Honest. Fair." — three words, three plans. Free tier = low-friction entry. Growth = what they want. Custom = enterprise anchor.

### 07 — CTA Strip
**Job:** Final conversion push

- Full dark section. Parallax golden glow (`bgY ±40px`)
- Decorative SVG cubes at corners
- Large serif headline + single primary CTA + ghost secondary
- **Copy principle:** Negative framing. "Stop losing customers to silence" — loss aversion as the hook.

### 08 — Footer
**Job:** Utility + brand close

- Golden gradient `<hr>` as transition from CTA
- Three columns: brand + social, newsletter form, nav grid + compliance
- Pulsing emerald beacon for system status
- Newsletter = second conversion opportunity
- **Motion:** `AnimatePresence` for email → success swap, pulsing `motion.div` on status beacon

---

## 8. Component Patterns

### Eyebrow + Heading Pattern
Every section opens identically: decorative line + uppercase micro label → large serif H2. The 32px line width is **always** the same.

```jsx
<div className="flex items-center gap-3 mb-6">
  <div className="w-8 h-px bg-[#9B7B4E]" />
  <span
    className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B7B4E]"
  >
    Section Label
  </span>
</div>
<h2
  style={{ fontFamily: 'Georgia, serif' }}
  className="text-5xl font-black text-[#1A1714]"
>
  Heading text here.
</h2>
```

### Feature Tab + Panel Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
  {/* Left: tab list */}
  <div className="lg:col-span-2">
    {/* Tabs with layoutId="featureTabBg" for smooth morph */}
  </div>
  {/* Right: detail panel */}
  <div className="lg:col-span-3">
    <AnimatePresence mode="wait">
      <motion.div
        key={activeFeature}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35 }}
      />
    </AnimatePresence>
  </div>
</div>
```

### Dark Detail Card
Splits into two zones: dark header + light gradient body. Maximum contrast without full-page inversion.

```jsx
<div
  className="rounded-3xl overflow-hidden"
  style={{ background: 'linear-gradient(135deg, #FFFCF8, #F5EFE4)' }}
>
  {/* Dark header zone */}
  <div
    className="p-10 pb-8"
    style={{ background: 'linear-gradient(135deg, #1A1714, #2E2820)' }}
  >
    {/* Icon + tag + title + description */}
  </div>
  {/* Light body zone */}
  <div className="p-10 pt-8">
    {/* Checkmark bullet + detail text + action links */}
  </div>
</div>
```

### Testimonial Card Trio
Three cards — outer two light, center dark with gold accents. All share identical internal structure: `metric → stars → quote → author`.

```jsx
// Color derives from index position:
background: i === 1 ? '#1A1714' : '#FFFFFF'
border:     i === 1 ? 'transparent' : '#E2D9CC'
// Accent color within card:
color:      i === 1 ? '#EAB564' : '#1A1714'
```

### Pricing Card Elevation
```jsx
className={cn(
  'relative p-8 rounded-3xl transition-all',
  plan.highlight
    ? 'bg-[#1A1714] scale-[1.03] shadow-2xl shadow-[#1A1714]/20'
    : 'bg-white border border-[#E2D9CC] hover:-translate-y-1'
)}
```

### Conditional Class Merging
All components use `cn()` for conditional classes. Never string concatenation.

```jsx
import { cn } from '@/lib/utils'

className={cn(
  'base-classes',
  condition && 'conditional-classes',
  variant === 'dark' && 'dark-variant-classes'
)}
```

---

## 9. The 10 Rules

> These are non-negotiable. Zero deviation.

| # | Rule |
|---|---|
| 01 | All headings: **Georgia serif, font-black (900).** All body: **system sans, regular.** Never mix. |
| 02 | Palette: warm parchment + ink + gold. **Zero blues. Zero purples.** |
| 03 | Every section opens with: **eyebrow label + 32px line + serif H2.** |
| 04 | SVG backgrounds: decorative only, **max 0.35 opacity**, `aria-hidden`, `pointer-events-none`. |
| 05 | Entry animations: fade+slide-up, **`once: true`**, `[0.22, 1, 0.36, 1]` ease. |
| 06 | Interactions: **spring physics** (stiffness/damping). Never CSS `transition` for motion. |
| 07 | Sections **alternate light/dark** backgrounds for visual rhythm. |
| 08 | **Custom colors via bracket notation only** — never Tailwind preset color names. |
| 09 | **Magnetic buttons** on all primary CTAs. Custom cursor is a brand touch. |
| 10 | **`AnimatePresence` + key swap** for all tab/state transitions. |

---

*Plugin Base Design System — maintain this as the single source of truth for all implementation decisions.*