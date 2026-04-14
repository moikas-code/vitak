# VitaK Tracker — Architecture Overview

**Last Updated:** 2026-04-13

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS + Shadcn UI
- **Backend:** tRPC for type-safe APIs, Clerk auth
- **Database:** Drizzle ORM with Cloudflare D1 (production) / better-sqlite3 (local dev)
- **State:** Zustand + React Query
- **PWA:** next-pwa for offline, IndexedDB for local storage
- **Payments:** Stripe for donations
- **Deployment:** Cloudflare Workers via opennextjs-cloudflare

## Architecture Diagram

```
┌──────────────────────────────────────────┐
│                 Client                     │
│  React 19 + Next.js 15 + Shadcn UI      │
│  Zustand Store + React Query Cache       │
│  IndexedDB (offline) + CryptoJS (encrypt)│
└───────────────────┬──────────────────────┘
                    │ tRPC Client
┌───────────────────▼──────────────────────┐
│              Next.js Server               │
│  ┌─────────────────────────────────────┐ │
│  │          Middleware (Clerk Auth)    │ │
│  │  - Protected routes check           │ │
│  │  - Admin routes check (DB lookup)   │ │
│  │  - HTTPS redirect in production     │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │          tRPC Routers               │ │
│  │  user | food | mealLog | credit     │ │
│  │  mealPreset | admin                 │ │
│  │  (all with Zod validation)          │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │         Security Layer              │ │
│  │  Input sanitization | Rate limiting  │ │
│  │  Security headers | HTML sanitization│ │
│  └─────────────────────────────────────┘ │
└───────────────────┬──────────────────────┘
                    │ Drizzle ORM
┌───────────────────▼──────────────────────┐
│     Cloudflare D1 (SQLite)               │
│  users | user_settings | foods           │
│  meal_logs | meal_presets | food_audit_log│
└──────────────────────────────────────────┘
```

## Key Modules

| Module | Location | Description |
|--------|----------|-------------|
| tRPC API | `lib/trpc/routers/` | 6 routers with Zod-validated mutations/queries |
| DB Schema | `lib/db/schema.ts` | Drizzle SQLite schema with 6 tables |
| Mappers | `lib/db/mappers.ts` | camelCase → snake_case conversion for API responses |
| Security | `lib/security/` | Input sanitization, rate limiting, headers |
| Offline | `lib/offline/` | IndexedDB, encryption, sync manager |
| Config | `lib/config/` | Constants, env validation, offline config |

## Data Flow

1. **Meal Logging:** User selects food → tRPC `mealLog.add` → validates food exists → calculates vitamin K → stores meal_log → returns with food data
2. **Credit Calculation:** `credit.getCurrentBalance` → queries meal_logs for period → sums vitamin K consumed → compares against user limits
3. **Offline:** Local writes to IndexedDB → queue in sync_queue → SyncManager processes when online → tRPC API calls with Bearer token

## Authentication Flow

1. Clerk middleware protects routes
2. `protectedProcedure` middleware requires `session.userId`
3. `adminProcedure` requires `session.userId` + `userRole === "admin"`
4. Bearer token support for offline API calls
5. Admin check hits DB on every admin request (known performance concern)

## Database Migrations

Located in `supabase/migrations/`. 11 migration files covering:
- Initial schema (users, foods, meal_logs, user_settings)
- RLS policy fixes (adapted for D1 — no RLS, but Clerk auth middleware)
- Food data updates
- Meal presets table
- User roles and food audit logging