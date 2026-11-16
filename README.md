# Lumora Connect

Tinder-style talent network for Lumora IT case hackathons in Uzbekistan. Front-end preview with mock data, no backend yet.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Publish for the team (GitHub Pages)

1. Create an empty repository on GitHub (for example `lumora-connect`), public.
2. Push this folder to it:

```bash
git remote add origin https://github.com/<your-login>/lumora-connect.git
git push -u origin main
```

3. In the repository: Settings, Pages, "Build and deployment", Source: **GitHub Actions**.
4. Wait for the "Deploy to GitHub Pages" workflow to finish (Actions tab). The site is at `https://<your-login>.github.io/lumora-connect/`.

Every later `git push` to `main` redeploys automatically.
