# Deploy — Vercel + Supabase

One Vercel project serves everything:
- `dist/` → React frontend (Vite)
- `api/index.js` → NestJS API (compiled from `server/src` to `server/dist`)
- Supabase → Postgres, Realtime (live sync), Storage (`backups` bucket)
- Vercel Cron → `/api/cron/backup` (00:00 UTC), `/api/cron/daily` (02:00 UTC)

## Steps
1. Push this folder to a new Git repo and import it in Vercel (framework: Vite; build settings come from `vercel.json`).
2. Project → Settings → Environment Variables: add every variable from `server/.env`
   (see `server/.env.example`). Do **not** add `PORT`. Set `NODE_ENV=production`.
3. Deploy. Check `https://<domain>/api/health` → `{"status":"ok","db":"connected"}`.

## Local
    npm install
    cd server && node dist/main.js        # API on :3001 (after npm run build:server)
    npm run dev                           # frontend on :5173, proxies /api

## Schema changes
    npx prisma db push --schema server/prisma/schema.prisma   # uses DIRECT_URL (5432)

## Limits to know
- Request bodies are capped at 4.5 MB on Vercel, so restore uploads must be under 4.5 MB.
- Function time limit is set to 60s (`vercel.json`).
