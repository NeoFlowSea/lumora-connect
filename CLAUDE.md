# Lumora Connect

Lumora Connect is the talent network of Lumora IT case competitions in Uzbekistan: students and young tech talent find internships, programs and jobs, companies find verified talent, and a mutual right swipe is a match. Lumora runs one-day IT case competitions across Uzbek cities. This repo is the front-end preview: the backend is a mock API that runs in the browser (`src/api`, localStorage). Each visitor has their own data. Demo logins are listed only in README.md, never on the site.

## Structure
- Intro splash (`src/components/Splash.tsx`): blue screen with the white shield, then strips wipe right. Shown once per visit; timers sit in a ref with a hard stop.
- Lumora pages `#/about`, `#/hackathons`, `#/contacts` (`src/landing/pages.tsx`), each a full version of a home section. Core team photos in `public/photos/team`.
- Lumora home `#/` (`src/landing/Home.tsx`): about Lumora as an organisation, short version of each page. Hero, numbers and partners, about, how a case competition works, winning projects, next hackathon and past rounds, Lumora Connect, FAQ, contacts. Texts in the `home` dictionary area.
- Lumora Connect landing `#/connect` (`src/landing/Landing.tsx`): dual-door hero with a calm card deck and job search, real numbers and partners, featured jobs, how it works, real winning projects, next hackathon (the only glitch heading), slogans, FAQ, final CTA.
- Both pages sit in `src/landing/SitePage.tsx` (background, header, footer, phone tab bar `SiteTabs.tsx`). Section links are `#/?to=<id>` and `#/connect?to=<id>` (`sectionLink()` in `src/lib/router.ts`); old anchors like `#talent` are redirected to the Connect page.
- Public pages: jobs list `#/jobs` (`src/app/JobsBrowser.tsx`), job page `#/jobs/:id`, company page `#/company/:id`, `#/privacy`, `#/terms`, 404. `src/pages/PublicFrame.tsx` shows them inside the app shell when signed in, otherwise with the site header and footer.
- Auth (`src/auth/*`): sign in, short sign-up (account type first, consent), forgot, reset and confirm with a Preview mailbox (the mock has no mail server). Onboarding wizard after the first sign-in (`src/onboarding/*`).
- App (`src/app/*`): talent tabs Swipe, Jobs, Events, Profile; company tabs Swipe, Dashboard, Events, Profile; plus Inbox, notifications and talent pages `#/app/talent/:id`. Own profile in `src/app/profile/*` with completeness and verification.
- Admin (`src/admin/*`, lazy-loaded): overview, verification queue, companies, users, events (editor, teams, results), opportunities, audit.
- Hash routes in `src/lib/router.ts`, guards in `src/App.tsx`.
- Mock backend (`src/api`): `types.ts` domain model, `seed.ts` sample data and `DEMO_ACCOUNTS`, `db.ts` localStorage store with change events, `index.ts` async API with permission checks, `crypto.ts` salted password hashes, `hooks.ts` (`useApi`, `useAction`, `useSession`). Shared primitives in `src/components/form.tsx` and `src/components/ui.tsx`.
- Real Lumora facts, past rounds, winning projects and photos: `src/content/lumora.ts`, `public/photos`. Sample people, companies, postings and upcoming events carry `demo: true` and show a "Demo profile" / "Sample" tag. Never attribute sample people to real rounds; never post fake jobs under real company names. Exception the team asked for: past rounds with no published data carry stand-in participant counts and winner names, listed per round in `placeholder` in `lumora.ts`; replace them with real data when known.
- `src/data.ts` holds the track list.

## Languages
Uzbek (Latin), Russian and English. `src/i18n/index.tsx` has `t("area.key", vars)`, `tp()` for plurals, `useLang()`, `locale()` and `trackLabel()`. Dictionaries are per area in `src/i18n/dict/<area>.ts`, each with en, ru and uz. Every visible string goes through them, including API errors and notifications (`api.ts`).

## Stack
Vite + React 18 + TypeScript, Tailwind v4 (`@import "tailwindcss"` in `src/index.css`, tokens in `@theme`), Framer Motion, Lenis, lucide-react, self-hosted fonts via @fontsource. `base: "./"` in vite.config so the build works on GitHub Pages. Deploy workflow in `.github/workflows/deploy.yml`: `main` goes to the site root, every `design/<name>` branch to `/<name>/`.

## Design rules
- Palette 60/30/10: navy `#0F2557` page background (60), blue `#3D7BFA` sections, cards, icons (30), orange `#FF8A3D` (hover `#F2752B`) only for the one main action per screen, active tab, key numbers (10). Tokens live in `@theme` in `src/index.css`; text is `ink` `#F4F7FF` and `mist` `#A9B7D8`.
- Logo: white shield with a `#3D7BFA` mark on a `#3D7BFA` rounded tile, exactly like `Logo.jpg` (traced paths live in `src/components/Logo.tsx`).
- Fonts: Onest for all text and headings (`font-display`, `font-body`). Rubik Glitch (`font-glitch`) only on the landing "Next Lumora hackathon" heading. Press Start 2P (`font-pixel`) only for countdown digits. Heading base styles sit in `@layer base` so these utilities win.
- No glow shadows, blurred blobs, dotted grids or gradient text. Radius scale: controls `rounded-lg`, cards `rounded-xl`, modals `rounded-2xl`, tags `rounded-md`, avatars `rounded-full`.
- Sentence case, no all-caps labels, no arrows in button text. Text at least 12px, tap targets at least 44px on phones.
- Respect `prefers-reduced-motion`. Keep everything usable at 375px with no horizontal scroll (bottom tab bar on phones).

## Looking hand-made, not generated
Before shipping any new section or screen, run the `anti-slop` skill (`.claude/skills/anti-slop/SKILL.md`). Short version:
- Specifics over decoration: real photos, real numbers, real names from `src/content/lumora.ts`. Never stock-style filler, invented stats or invented quotes.
- Do not repeat one layout. No run of identical "icon, bold title, grey sentence" cards; vary the grid, scale and density between sections, and let one section be plain text or one big photo.
- No purple-blue gradients, glassmorphism, cards nested in cards, coloured left-edge stripes on cards, emoji as icons, or "Welcome to / Unlock / Seamless / Elevate / Empower" copy.
- Cursor spotlights, glowing orbs and animated grids count as glow: keep them out of new work.
- Copy is short, concrete and written the way a Lumora organiser would say it. Check ru and uz in a real sentence, not a translation of the English.
- One idea per screen, one orange action per screen, generous but uneven spacing; align to a real grid instead of centring everything.

## Commands
`npm run dev` starts the dev server on http://localhost:5173. `npm run build` type-checks and builds into `dist`.
