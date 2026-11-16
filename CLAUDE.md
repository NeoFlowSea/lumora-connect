# Lumora Connect

Lumora Connect is a Tinder-style talent network for Uzbekistan: hackathon winners and young tech talent swipe companies, companies swipe verified talent, a mutual right swipe is a match. Lumora runs IT case hackathons across Uzbek cities. This repo is the front-end preview only: all data is mock, there is no backend yet.

## Structure
- Intro splash (`src/components/Splash.tsx`): blue screen with the white shield, then vertical strips wipe right, like the Tinder iOS launch.
- Public landing (`src/landing/*`): hero with a self-swiping deck, stats, how it works, tracks, winners, opportunities, hackathons, join, footer. Lenis smooth scroll, Framer Motion reveals.
- App (`src/app/*`) behind a role choice (talent or company), four tabs: Swipe, Opportunities, Hackathons, Profile. Hash routes `#/app/<tab>` in `src/lib/router.ts`; state (role, likes, applications, registrations) in `src/lib/store.ts`, persisted to localStorage.
- Mock data in `src/data.ts`.

## Stack
Vite + React 18 + TypeScript, Tailwind v4 (`@import "tailwindcss"` in `src/index.css`, tokens in `@theme`), Framer Motion, Lenis, lucide-react. `base: "./"` in vite.config so the build works on GitHub Pages. Deploy workflow in `.github/workflows/deploy.yml`.

## Design rules
- Light theme, white and blue like the original logo: blue `#1a4ba8`, sky `#4f8be0`, tint `#e9f1fc`, ink `#0b1f3a`, mist `#5b6b82`. No other hues except green/red for like/nope.
- Logo: white shield with blue mark on a blue rounded tile, exactly like `Logo.jpg` (traced paths live in `src/components/Logo.tsx`).
- Display font Unbounded, body font Manrope. Sentence case, no all-caps labels, no arrows in button text.
- Respect `prefers-reduced-motion`. Keep everything usable at 375px (bottom tab bar on phones).

## Commands
`npm run dev` starts the dev server on http://localhost:5173. `npm run build` type-checks and builds into `dist`.
