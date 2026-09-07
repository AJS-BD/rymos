# RYmos E-Commerce Redesign — Apple-Inspired

## Design Philosophy

**Current:** Traditional e-commerce (buttons, grids, cards, cluttered)
**Target:** Apple.com aesthetic (minimal, image-first, immersive, animated)

---

## 1. Loading Screen Animation

**Concept:** Branded loading experience before site loads

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           ◉ RYmos                   │
│         ═══════                     │
│       (progress bar)                │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
- Full-screen overlay with black/dark background
- Centered logo with subtle pulse animation
- Progress bar that fills as assets load
- Fade-out transition when ready
- Duration: 1.5-2 seconds (or until assets loaded)

**Tech:** Custom `LoadingScreen` component with CSS animations

---

## 2. Page Route Animations

**Concept:** Smooth transitions between pages (no hard cuts)

**Types:**
- **Fade + Scale:** Current page fades out slightly zoomed, new page fades in
- **Slide:** Pages slide horizontally with spring physics
- **Shared Layout:** Header/footer persist, only content animates

**Implementation:**
- Wrap routes in `AnimatePresence` from framer-motion
- Exit: `opacity: 0, scale: 0.98, y: 10`
- Enter: `opacity: 1, scale: 1, y: 0`
- Duration: 0.4s with spring easing

**Tech:** `framer-motion` `AnimatePresence` + `motion.main`

---

## 3. 3D Scroll Animations

**Concept:** Immersive scroll-driven animations throughout

**Homepage Sections:**

| Section | Animation |
|---------|-----------|
| Hero | Parallax background, text scales on scroll |
| Products | Cards rotate into view (3D flip) |
| Specs | Image zooms, specs slide in from sides |
| Testimonials | Cards stack/parallax |
| Newsletter | Background parallax, content fades |

**Implementation:**
- `useScroll` + `useTransform` hooks
- `whileInView` for scroll-triggered animations
- 3D transforms: `rotateX`, `rotateY`, `perspective`
- Spring physics for natural feel

**Tech:** `framer-motion` scroll-linked animations

---

## 4. Sidebar Animation

**Concept:** Animated navigation drawer (not just slide)

**States:**
- **Closed:** Hidden off-screen left
- **Open:** Slides in with spring, backdrop fades
- **Items:** Staggered entrance (each link delays slightly)

**Animation:**
```
Closed → Open:
  Backdrop: opacity 0 → 0.5 (0.3s)
  Panel: x: -100% → 0% (spring, stiffness: 300)
  Links: staggerChildren (0.05s each)
    Each: opacity 0 → 1, x: -20 → 0
```

**Implementation:**
- `motion.nav` with spring physics
- `staggerChildren` for link animations
- Backdrop blur effect
- Swipe-to-close on mobile

**Tech:** `framer-motion` `motion.nav` + `AnimatePresence`

---

## 5. Homepage Redesign

**Current Layout:**
```
[Header]
[Hero Banner - text left, image right]
[Category Icons]
[Featured Products - 4-col grid]
[Find Phone Quiz]
[Spec Banner]
[Best Sellers - 5-col grid]
[Accessories + Deals]
[Service Guarantees]
[New Arrivals]
[Testimonials]
[App Download]
[Newsletter]
[Footer]
```

**New Apple-Inspired Layout:**

```
[Header - minimal, transparent over hero]

═══════════════════════════════════════
║                                     ║
║         HERO (Full Viewport)        ║
║                                     ║
║    Large product image (60% width)  ║
║    Minimal text overlay             ║
║    Scroll indicator ↓               ║
║                                     ║
═══════════════════════════════════════

[Product Showcase - Horizontal Scroll]
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│     │ │     │ │     │ │     │
│ P1  │ │ P2  │ │ P3  │ │ P4  │  ← Scroll horizontally
│     │ │     │ │     │ │     │
└─────┘ └─────┘ └─────┘ └─────┘

═══════════════════════════════════════
║                                     ║
║     FEATURED PRODUCT (Full Width)   ║
║                                     ║
║     Large image + minimal text      ║
║     "Shop Now" (text link, no btn)  ║
║                                     ║
═══════════════════════════════════════

[Spec Highlights - 2x2 Grid, large]
┌─────────────┐ ┌─────────────┐
│   Camera    │ │   Battery   │
│   (image)   │ │   (image)   │
└─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐
│   Display   │ │   Storage   │
│   (image)   │ │   (image)   │
└─────────────┘ └─────────────┘

═══════════════════════════════════════
║                                     ║
║     TESTIMONIALS (Auto-scroll)      ║
║                                     ║
║     Large quotes, minimal chrome    ║
║                                     ║
═══════════════════════════════════════

[Footer - minimal, 2 columns only]
```

---

## 6. Product Card Redesign

**Current:**
```
┌─────────────────┐
│  [Image]        │
│  15% off        │
│  Product Name   │
│  Specs          │
│  ★★★★☆ (245)    │
│  ৳129,999       │
│  ৳149,999       │
│  [Add to Cart]  │
└─────────────────┘
```

**New Apple Style:**
```
┌─────────────────────────┐
│                         │
│                         │
│     [Large Image]       │
│                         │
│                         │
│     Product Name        │
│     ৳129,999            │
│                         │
└─────────────────────────┘
```

**Changes:**
- No discount badge (clutter)
- No star ratings (trust the product)
- No "Add to Cart" button (tap card to view)
- Large image dominates
- Hover: subtle scale + shadow
- Clean, lots of whitespace

---

## 7. Color & Typography

**Current:** Black/white/red accent
**New:** Apple-style palette

```
Background:    #FFFFFF (pure white)
Secondary:     #F5F5F7 (light gray sections)
Text Primary:  #1D1D1F (near black)
Text Secondary: #86868B (muted gray)
Accent:        #0071E3 (blue links/buttons)
Border:        #D2D2D7 (subtle borders)
```

**Typography:**
```
Headings: SF Pro Display (or Inter)
Body: SF Pro Text (or Inter)
Weights: 400 (regular), 600 (semibold), 700 (bold)
Sizes: Large hero (48-64px), Section (32-40px), Body (16-18px)
```

---

## 8. Button Redesign

**Current:** Solid black buttons everywhere
**New:** Minimal, text-first approach

```
Primary:   Blue text link → "Shop Now →"
Secondary: Outlined, subtle border
Tertiary:  Text only, no border
Hero:      "Learn More" + "Buy" (side by side, text links)
```

**Rules:**
- Max 2 buttons per section
- Prefer text links over buttons
- Buttons only for primary CTAs (Buy, Checkout)
- Hover: subtle color change, no scale

---

## 9. Header Redesign

**Current:** Logo + nav + search + icons (cluttered)
**New:** Ultra-minimal

```
Desktop:
┌─────────────────────────────────────────────────────┐
│  RYmos    Products  Accessories  Deals    [Search]  │
└─────────────────────────────────────────────────────┘

Mobile:
┌─────────────────────────────────────────────────────┐
│  RYmos                              [Menu] [Search] │
└─────────────────────────────────────────────────────┘
```

**Changes:**
- Remove wishlist/profile icons from header
- Search icon only (expands on click)
- Transparent over hero, white on scroll
- Thinner font weight
- More whitespace

---

## 10. Implementation Plan

### Phase 1: Foundation
1. Create loading screen component
2. Set up page route animations
3. Update color palette + typography
4. Redesign header (minimal)

### Phase 2: Homepage
5. Full-viewport hero with parallax
6. Horizontal product scroll section
7. Large featured product section
8. Redesigned spec highlights
9. Auto-scrolling testimonials

### Phase 3: Animations
10. 3D scroll animations (useScroll)
11. Sidebar animation (spring physics)
12. Product card hover effects
13. Section entrance animations

### Phase 4: Polish
14. Product detail page redesign
15. Cart/checkout minimal design
16. Admin panel consistency
17. Performance optimization

---

## Tech Stack Additions

```
- framer-motion (already installed) — animations
- @react-spring/parallax — parallax effects
- lenis (smooth scroll) — buttery scrolling
- Custom CSS — 3D transforms, perspective
```

---

## File Structure Changes

```
src/
├── app/
│   ├── layout.tsx          # Add AnimatePresence
│   ├── page.tsx            # Redesigned homepage
│   ├── loading.tsx         # Loading screen
│   └── globals.css         # New color palette
├── components/
│   ├── ui/
│   │   ├── loading-screen.tsx
│   │   ├── page-transition.tsx
│   │   └── animated-section.tsx
│   ├── layout/
│   │   ├── header.tsx      # Minimal redesign
│   │   ├── footer.tsx      # 2-column minimal
│   │   └── sidebar.tsx     # Animated drawer
│   ├── home/
│   │   ├── hero.tsx        # Full viewport
│   │   ├── product-scroll.tsx  # Horizontal
│   │   ├── featured-product.tsx # Large showcase
│   │   └── spec-highlights.tsx  # 2x2 grid
│   └── products/
│       └── product-card.tsx    # Minimal card
```

---

## Key Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Buttons per page | 8-12 | 2-3 |
| Image coverage | 30% | 60% |
| Scroll animations | 0 | 15+ |
| Page transitions | Hard cut | Smooth fade |
| Loading experience | None | Branded animation |
| Color palette | 5 colors | 3 colors |
| Font weights | 4 | 2-3 |

---

## Next Steps

1. **Review this plan** — approve or suggest changes
2. **Phase 1** — Foundation (loading, transitions, colors)
3. **Phase 2** — Homepage redesign
4. **Phase 3** — Animations
5. **Phase 4** — Polish

**Estimated Time:** 2-3 sessions for full redesign

---

**Ready to start?**
