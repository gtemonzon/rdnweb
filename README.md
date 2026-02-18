# El Refugio de la Niñez – Web

## Environment Variables

**Local development** – copy `.env.example` to `.env` and fill in your values:

```sh
cp .env.example .env
```

**Production (Lovable Cloud)** – environment variables are automatically injected.
For external deployments (e.g. Vercel), configure all `VITE_` variables in
*Project Settings → Environment Variables*. **Never commit `.env` to the repo.**

Variables needed are documented in `.env.example`.

---

## Security & Performance Checklist

- ✅ `.env` is git-ignored (auto-managed by Lovable Cloud)
- ✅ `.env.example` exists with placeholder values
- ✅ Admin uploads generate optimized WebP variants (large 2000px + thumb 600px) via Canvas API
- ✅ Frontend uses `loading="lazy"` and `decoding="async"` on non-critical images
- ✅ Hero fallback image is WebP (`/public/images/hero-fallback.webp`)
- ✅ Static assets (logo, CTA, mission, vision) converted to WebP in `src/assets/`

---

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Lovable Cloud (Supabase) – database, auth, storage, edge functions

## How to run locally

```sh
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Deployment

Open [Lovable](https://lovable.dev) and click Share → Publish.
For a custom domain: Project → Settings → Domains → Connect Domain.
See [docs](https://docs.lovable.dev/features/custom-domain).
