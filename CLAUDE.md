# Lumora Connect

Lumora Connect is a Tinder-style talent network for Uzbekistan: hackathon winners and young tech talent swipe companies, companies swipe verified talent, a mutual right swipe is a match. Lumora runs IT case hackathons across Uzbek cities. This repo is the front-end preview: the backend is a mock API that runs in the browser (`src/api`, localStorage), with seeded demo accounts. Each visitor has their own data.

## Structure
- Intro splash (`src/components/Splash.tsx`): blue screen with the white shield, then vertical strips wipe right, like the Tinder iOS launch.
- Public landing (`src/landing/*`): hero with a self-swiping deck, stats, how it works, tracks, winners, opportunities, hackathons, join, footer. Lenis smooth scroll, Framer Motion reveals.
- Auth (`src/auth/AuthScreen.tsx`): login, two-step register (account type first), demo accounts panel. App (`src/app/*`): talent tabs Swipe, Opportunities, Hackathons, Profile; company tabs Swipe, Dashboard, Hackathons, Profile; plus Inbox (matches and chat) and notifications. Admin (`src/admin/*`): overview, companies, users, events (editor, teams, results), opportunities, audit. Hash routes in `src/lib/router.ts`, guards in `src/App.tsx`.
- Mock backend (`src/api`): `types.ts` domain model, `seed.ts` demo data and `DEMO_ACCOUNTS`, `db.ts` localStorage store with change events, `index.ts` async API with permission checks, `hooks.ts` (`useApi`, `useAction`, `useSession`). Shared form and state primitives in `src/components/form.tsx`.
- `src/data.ts` holds the static source lists the seed is built from (categories, companies, talents, opportunities).
- Glitch headings use `src/components/GlitchText.tsx`: only transform and opacity animate (compositor), phase locked to the wall clock via the Web Animations API.

## Stack
Vite + React 18 + TypeScript, Tailwind v4 (`@import "tailwindcss"` in `src/index.css`, tokens in `@theme`), Framer Motion, Lenis, lucide-react. `base: "./"` in vite.config so the build works on GitHub Pages. Deploy workflow in `.github/workflows/deploy.yml`: `main` goes to the site root, every `design/<name>` branch to `/<name>/`.

## Design rules
- Palette 60/30/10: navy `#0F2557` page background (60), blue `#3D7BFA` sections, cards, icons (30), yellow `#FFC93C` only for main buttons, active tab, stats and highlights (10). Tokens live in `@theme` in `src/index.css`; text is `ink` `#F4F7FF` and `mist` `#A9B7D8`.
- Logo: white shield with a `#3D7BFA` mark on a `#3D7BFA` rounded tile, exactly like `Logo.jpg` (traced paths live in `src/components/Logo.tsx`).
- Fonts: IBM Plex Mono for all text and most headings (`font-display`, `font-body`). Rubik Glitch (`font-glitch`) only on the hero title and the landing "Next Lumora hackathon" heading. Press Start 2P (`font-pixel`) only for countdown digits. Heading base styles sit in `@layer base` so these utilities win. Sentence case, no all-caps labels, no arrows in button text.
- Respect `prefers-reduced-motion`. Keep everything usable at 375px (bottom tab bar on phones).

## Commands
`npm run dev` starts the dev server on http://localhost:5173. `npm run build` type-checks and builds into `dist`.
