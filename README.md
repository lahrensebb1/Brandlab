# brand lab.

Landing page for **Brand Lab** — a creative studio that builds clean, clear
websites for businesses that are better than their website makes them look.

## Stack

- **Vite** — build & dev server
- **GSAP + ScrollTrigger** — loader, line-mask reveals, draw-on hand-drawn strokes,
  scroll-velocity marquee, pinned horizontal process section, magnetic buttons
- **Layered 2D hero** — mascot scene, plant and floor papers are separate layers
  with pointer parallax, idle motion and blinking; each layer is a named slot
  (`#mascot-slot`, `#plant-slot`, `#papers-slot`, `#logo-slot`) holding a
  placeholder SVG that gets swapped for the final illustrated assets
- (A procedural Three.js flask mascot lives in `src/js/scene.js`, currently unused)
- **Lenis** — smooth scrolling
- Self-hosted variable fonts: Bricolage Grotesque (display), Shantell Sans
  (handwritten accents), Hanken Grotesk (body)

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the production build
```

## Structure

```
index.html              all sections + inline SVG illustrations
src/styles/main.css     design tokens, components, sections, responsive
src/js/main.js          boot, Lenis, menu, FAQ, before/after slider, magnetic buttons
src/js/animations.js    loader timeline + every scroll animation
src/js/scene.js         the 3D mascot
public/fonts/           self-hosted woff2 (no external font requests)
scripts/shoot.mjs       Playwright screenshot helper used during development
```

## Notes

- The final CTA mails `lahrensebb1@gmail.com` — swap this for the studio
  address when there is one (search for `mailto:` in `index.html`).
- All copy, pricing and section order follow the Brand Lab positioning,
  pricing and homepage-context documents. Prices are ex. VAT.
- Honors `prefers-reduced-motion` and falls back to a 2D SVG mascot when
  WebGL is unavailable.
