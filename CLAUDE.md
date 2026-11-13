# Lumora Connect

Landing page for Lumora Connect: a talent network (LinkedIn + hh.ru style) that links hackathon winners and young tech talent in Uzbekistan with companies offering internships, work programs, positions and events. Lumora runs IT case hackathons across Uzbek cities.

## Audience and tone
Mostly students and junior developers, some teens. Business-like but stylish. English first; Russian and Uzbek later (fonts must support Cyrillic).

## Stack
Vite + React 18 + TypeScript, Tailwind v4 (`@import "tailwindcss"` in `src/index.css`), Framer Motion, React Three Fiber + drei for 3D, Lenis for smooth scroll, lucide-react icons.

## Design rules
- Dark + blue only. Base black `#050608`, navy `#0B2A6B` (logo shield), royal `#1E5BD6`, ice `#BFD6FF`, white `#F2F5FA`. No other hues.
- Display font Unbounded, body font Manrope. Sentence case everywhere, no all-caps labels, no arrows in button text, no middle-dot meta strings.
- The hero constellation is the one bold element. Everything else stays quiet: generous space, hairline rules, few cards.
- Respect `prefers-reduced-motion`. Keep the page usable at 375px.

## Reference material
`Lumora_Connect_prototype .html` is the earlier functional prototype (data model, categories, flows). `Logo.jpg` is the original logo; `public/logo.svg` is the vector redraw used on the site.

## Commands
`npm run dev` starts the dev server on http://localhost:5173. `npm run build` type-checks and builds.
