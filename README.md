# DevLog — Frontend-only Work-log

Personal developer work-log (frontend-only). Stores a JSON file in a private GitHub repo under `data/tasks.json` and keeps edits locally until you `Sync`.

## Quick start

1. Create a private GitHub repo (example `devlog-data`).
2. Create an empty file at `data/tasks.json` (or allow the app to create one).
3. Create a fine-grained PAT with repository contents read & write on that repo only.
4. Set environment variables when running the app. For local testing, create a `.env` file in the project root with these values:

```env
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=your-private-repo-name
VITE_GITHUB_FILE_PATH=data/tasks.json
```

The repository includes `.env.example` and `.gitignore` so your local `.env` is not committed.

Install and run:

```bash
npm install
npm run dev
```

Open the app, paste your PAT on the login screen. Token is stored in `sessionStorage.devlog_token` only.

## How it works

- On login the app attempts to `GET` the configured file from GitHub. If missing, it will create a seeded JSON file.
- Fetched content is saved to `localStorage.devlog_data` and the file SHA to `localStorage.devlog_sha`.
- Edits only update `localStorage.devlog_data` and set `localStorage.devlog_dirty` = `true`.
- Use `Sync` to push the current local JSON to GitHub (PUT to contents API). Use `Fetch` to pull remote into local (will warn and block if there are unsaved local changes).

## Security

- This app stores your PAT in `sessionStorage` for convenience — do not share it. For personal use only.
- Do not commit tokens or credentials.

## Deploy

This is a static frontend app. Deploy to Vercel, Netlify or Cloudflare Pages. Provide the environment variables in the deployment settings.

## Schema

See `data/tasks.json` schema in the project README (and in `src/types.ts`).

