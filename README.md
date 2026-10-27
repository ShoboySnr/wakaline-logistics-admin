# Waka Line Logistics — Admin Panel

Next.js admin panel for Waka Line Logistics. It talks to the Laravel app in `../web` through the admin REST API (`/api/admin/v1`), authenticated with Sanctum bearer tokens issued to users with `is_admin = 1`.

## Setup

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL to the Laravel /api URL
npm install
npm run dev                  # http://localhost:3001
```

## Scripts

- `npm run dev` — development server on port 3001
- `npm run build` — production build
- `npm run lint` — ESLint

## Structure

- `src/app` — App Router pages (`/login`, `/dashboard/...`)
- `src/api` — API calls and React Query hooks per module
- `src/components` — atoms, molecules, organisms, modals, layouts
- `src/helpers/request.ts` — fetch wrapper (bearer token, JSON/FormData, error handling)
- `src/store` — Zustand store persisted under `waka-admin`
