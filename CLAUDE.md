# Lumora Connect

Lumora Connect is a Tinder-style talent network for Uzbekistan: hackathon winners and young tech talent swipe companies, companies swipe verified talent, a mutual right swipe is a match. Lumora runs IT case hackathons across Uzbek cities. This repo is the front-end preview only: all data is mock, there is no backend yet.

## Structure
- Intro splash (`src/components/Splash.tsx`): blue screen with the white shield, then vertical strips wipe right, like the Tinder iOS launch.
- Public landing (`src/landing/*`): hero with a self-swiping deck, stats, how it works, tracks, winners, opportunities, hackathons, join, footer. Lenis smooth scroll, Framer Motion reveals.
- App (`src/app/*`) behind a role choice (talent or company), four tabs: Swipe, Opportunities, Hackathons, Profile. Hash routes `#/app/<tab>` in `src/lib/router.ts`; state (role, likes, applications, registrations) in `src/lib/store.ts`, persisted to localStorage.
- Mock data in `src/data.ts`.

## Stack
Vite + React 18 + TypeScript, Tailwind v4 (`@import "tailwindcss"` in `src/index.css`, tokens in `@theme`), Framer Motion, Lenis, lucide-react. `base: "./"` in vite.config so the build works on GitHub Pages. Deploy workflow in `.github/workflows/deploy.yml`: `main` goes to the site root, every `design/<name>` branch to `/<name>/`.

## Design rules
- Palette 60/30/10: navy `#0F2557` page background (60), blue `#3D7BFA` sections, cards, icons (30), yellow `#FFC93C` only for main buttons, active tab, stats and highlights (10). Tokens live in `@theme` in `src/index.css`; text is `ink` `#F4F7FF` and `mist` `#A9B7D8`.
- Logo: white shield with a `#3D7BFA` mark on a `#3D7BFA` rounded tile, exactly like `Logo.jpg` (traced paths live in `src/components/Logo.tsx`).
- Display font Unbounded, body font Manrope. Sentence case, no all-caps labels, no arrows in button text.
- Respect `prefers-reduced-motion`. Keep everything usable at 375px (bottom tab bar on phones).

## Commands
`npm run dev` starts the dev server on http://localhost:5173. `npm run build` type-checks and builds into `dist`.
