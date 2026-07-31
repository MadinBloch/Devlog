# DevLog React — GitHub-backed Work OS

Personal developer work-log (frontend-only). Matches the Laravel DevLog Work OS UI.

- **Source of truth:** private GitHub file `data/tasks.json`
- **Working copy:** `localStorage` (edits are local until Sync)
- **↓ Fetch** — GitHub → localStorage (`git pull` style)
- **↑ Sync** — localStorage → GitHub (`git push` style)
- Auto-fetch after login / page load

## Setup

1. Create a private GitHub repo (e.g. `devlog-data`).
2. Allow the app to create `data/tasks.json`, or add an empty JSON file yourself.
3. Create a fine-grained PAT with **Contents: Read and Write** on that repo only.
4. Copy `.env.example` → `.env`:

```env
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=your-private-repo-name
VITE_GITHUB_FILE_PATH=data/tasks.json
```

```bash
npm install
npm run dev
```

Paste your PAT on the login screen. Token is stored in `sessionStorage` only.

## Daily workflow

1. Open app → auto Fetch from GitHub  
2. Add/edit/complete tasks (local only)  
3. Click **↑ Sync** before you leave  
4. On another PC: open app (or click **↓ Fetch**) → see the same data  

## Features

- Dashboard, Today, Pending (filters), Completed, Reports, Boards, Search, Settings
- Timer with estimate presets, live clock, progress, overtime
- Complete modal (commit + notes)
- Dark / light theme
- Keyboard: `N` new task, `/` search, `Ctrl+S` sync, `Ctrl+Shift+F` fetch

## Deploy

Static site — Vercel, Netlify, or Cloudflare Pages. Set the same `VITE_*` env vars in the host.

## Security

Personal use only. Never commit your PAT. Anyone with the token can write to your data repo.
