# Lumora Connect

The talent network of Lumora IT case competitions in Uzbekistan. Students and young tech talent find internships, programs and jobs; companies find verified talent. A mutual right swipe is a match and opens a chat.

This is a front-end preview hosted on GitHub Pages. The "backend" is a mock API that runs in the visitor's browser (`src/api`) and saves to localStorage, so every visitor has their own copy of the data and nothing is shared between people. A real backend (for example Supabase) can replace `src/api/index.ts` behind the same function signatures.

The interface is in Uzbek, Russian and English (switch in the header). Dictionaries live in `src/i18n/dict/<area>.ts`.

## Demo accounts

These logins are listed only here, never on the site.

| Role | Email | Password | What it shows |
|---|---|---|---|
| Talent | talent.winner@demo.lumora.uz | Demo1234! | Verified, 1st place badge from the sample Demo Cup, matched with NovaSoft |
| Talent | talent.verified@demo.lumora.uz | Demo1234! | Verified by university email, no badge |
| Talent | talent.new@demo.lumora.uz | Demo1234! | New and unverified, goes through the onboarding |
| Company | company.approved@demo.lumora.uz | Demo1234! | NovaSoft, postings with applicants |
| Company | company.pending@demo.lumora.uz | Demo1234! | Silk Road Labs, waiting for admin approval |
| Organization | org.partner@demo.lumora.uz | Demo1234! | Kelajak Tech Community, runs a partner hackathon |
| Super admin | admin@demo.lumora.uz | Admin1234! | Everything, including deleting and managing admins |
| Moderator | moderator@demo.lumora.uz | Mod1234! | Reviews and verifies, cannot delete or manage admins |

These passwords are for the mock only and must never be reused with a real backend. To start over, clear the site data for the page in the browser (or remove the `lumora-db` and `lumora-session` keys from localStorage).

The preview has no mail server. Password reset and email confirmation letters land in a "Preview mailbox" shown on the reset and confirmation screens, so the links can be tested.

## Real data and sample data

- Real: Lumora's numbers, team, partners, judges, the 15 past rounds, 6 winning projects and the event photos (`src/content/lumora.ts`, `public/photos`), collected from the previous Lumora site and the Lumora Telegram channel.
- Samples: all people, companies, job postings and upcoming events in `src/api/seed.ts`. They carry `demo: true` and the interface marks them as "Demo profile" or "Sample". Company names are fictional. Demo badges come from a sample event ("Lumora Demo Cup 2026"), never from real rounds.

## Account levels

1. Unverified: a short sign-up (name, email, password, track, city, consent). After the first sign-in a step-by-step onboarding fills the profile.
2. Verified: the required profile items are filled and one proof is added: a Lumora result (checked automatically), a university email, a GitHub profile, or admin review. Companies prove a work email on their website domain or ask for admin review, and also need admin approval before they can post and swipe.

## What is in the app

- Public: landing page, jobs search (`#/jobs`), job pages (`#/jobs/:id`), company pages (`#/company/:id`), privacy and terms.
- Talent: swipe companies, matches and chat, jobs and applications with cover notes, questions and CV, hackathon registration, profile with education, languages, experience, projects, CV, badges and verification.
- Company: swipe talent, dashboard with detailed postings and applicants, chat, company profile.
- Admin (loaded only for admins): overview, verification queue, company approvals, users, event editor, teams and results, posting moderation, audit log.
- Passwords are stored as salted, iterated SHA-256 hashes in the mock. A real backend must hash on the server with bcrypt or argon2.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Publishing

`main` is published at the site root. Every `design/<name>` branch is published next to it at `/<name>/` by `.github/workflows/deploy.yml`; pushing such a branch re-runs the deploy through `preview-trigger.yml`.
