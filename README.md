# Lumora Connect

Tinder-style talent network for Lumora IT case hackathons in Uzbekistan. Talent swipes companies, companies swipe verified talent, a mutual right swipe is a match.

This is a front-end preview hosted on GitHub Pages. The "backend" is a mock API that runs in the visitor's browser (`src/api`) and saves to localStorage, so every visitor has their own copy of the data and nothing is shared between people. A real backend (for example Supabase) can replace `src/api/index.ts` behind the same function signatures.

## Demo accounts

| Role | Email | Password | What it shows |
|---|---|---|---|
| Talent | talent.winner@demo.lumora.uz | Demo1234! | Verified, 1st place badge, matched with NovaSoft |
| Talent | talent.verified@demo.lumora.uz | Demo1234! | Verified, no badge yet |
| Talent | talent.new@demo.lumora.uz | Demo1234! | New and unverified |
| Company | company.approved@demo.lumora.uz | Demo1234! | NovaSoft, postings with applicants |
| Company | company.pending@demo.lumora.uz | Demo1234! | Waiting for admin approval |
| Organization | org.partner@demo.lumora.uz | Demo1234! | AI Alliance, partner hackathon organizer |
| Super admin | admin@demo.lumora.uz | Admin1234! | Everything, including deleting and managing admins |
| Moderator | moderator@demo.lumora.uz | Mod1234! | Reviews and verifies, cannot delete or manage admins |

The Login page has a one-click panel with all of them and a "Reset demo data" button. These passwords are for the mock only and must never be reused with a real backend.

## What is in the app

- Register with an account type chosen first (talent, or company / organization). New companies wait for admin approval.
- Talent: swipe companies, matches and chat, opportunities and applications, hackathon team registration, profile with badges.
- Company: swipe talent, dashboard with postings and applicants (shortlist, accept, reject), chat, profile.
- Admin: overview, company approvals, users (verify, award or revoke badges, delete, manage admins), event editor, teams and results, posting moderation, audit log.
- Event editor: organizer, type, description, case brief, accent color, place and format, dates and registration window, tracks (including custom ones), team size, solo, max teams, ages, languages, any number of winning places (1 to 20) with prizes, nominations, finalists, jury, mentors, sponsors, agenda, which extra registration fields are required, and status. Assigning results gives badges to team leads.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Publishing

`main` is published at the site root. Every `design/<name>` branch is published next to it at `/<name>/` by `.github/workflows/deploy.yml`; pushing such a branch re-runs the deploy through `preview-trigger.yml`.
