# Vastra House Frontend

Standalone Next.js storefront/admin frontend.

## Local Setup

```bash
npm install
npm run dev
```

## Required Environment

Create `.env.local` locally or set this in Vercel:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api/v1
```

For the current backend, use:

```bash
NEXT_PUBLIC_API_BASE_URL=https://new-vastra-house-backend.onrender.com/api/v1
```

## Deploy On Vercel

- Framework: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave default
- Node.js version: `22.x`

Do not commit `.env.production`; keep production values in Vercel Environment Variables.
