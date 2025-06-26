# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
bun dev              # Start development server (localhost:3000)
bun install         # Install dependencies

# Quality Assurance
bun run lint        # ESLint checking
bun run typecheck   # TypeScript type checking

# Production
bun run build       # Build for production
bun start           # Start production server

# Database Migrations
bunx supabase migration new <name>  # Create new migration file
```

## Architecture Overview

VitaK Tracker is a PWA for Vitamin K intake management built with Next.js 15 App Router, tRPC, and Supabase.

**Key Technologies:**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS + Shadcn UI
- **Backend**: tRPC for type-safe APIs, Supabase (PostgreSQL) with RLS
- **Auth**: Clerk with custom sign-in/sign-up pages
- **State**: Zustand + React Query for server state caching
- **PWA**: next-pwa for offline functionality

## Database Schema

**Core Tables:**
- `user_settings` - User preferences and vitamin K limits (daily/weekly/monthly)
- `foods` - Comprehensive food database with vitamin K content per 100g
- `meal_logs` - User meal entries with calculated vitamin K consumption

**Key Features:**
- Row Level Security (RLS) isolates user data
- Full-text search on foods table using GIN indexes
- Enum type `food_category` for food categorization
- Automated timestamp updates via triggers

## tRPC API Structure

**Router Organization:**
- `userRouter` - User settings CRUD
- `foodRouter` - Food search and filtering
- `mealLogRouter` - Meal logging and history queries
- `creditRouter` - Vitamin K credit calculations

**Important Patterns:**
- All mutations use `protectedProcedure` requiring Clerk authentication
- Zod schemas validate all inputs
- Date ranges use `start_date`/`end_date` properties (not `start`/`end`)
- Queries joining tables use Supabase syntax: `.select("*, food:foods(*)")`

## Key Implementation Details

**Authentication Flow:**
- Middleware protects `/dashboard/*` and `/api/trpc/*` routes
- Public routes: `/`, `/auth/*`, `/donate/success`
- Clerk user ID stored as `user_id` (TEXT) in database tables

**Database Queries:**
- Always use `supabaseAdmin` client for server-side queries
- Include food data in meal queries: `.select("*, food:foods(*)")`
- Date filtering uses `.gte()` and `.lte()` with ISO strings

**Component Patterns:**
- Dashboard components expect meal objects with joined food data
- Use `meal.food?.name` to display food names safely
- Credit display components expect balance objects with `credits_used`/`credits_limit`

**Migration Conventions:**
- Use `bunx supabase migration new <name>` to create migration files
- Migration files follow format: `YYYYMMDDHHMMSS_description.sql`
- Never edit existing migrations; create new ones for changes

## Critical Code Conventions

**From user's global CLAUDE.md:**
- Use `snake_case` for variables/functions (except React Hooks)
- Always use TypeScript with Zod validation
- Write unit tests for new functionality
- Use DRY methodology and functional programming patterns
- Never commit secrets or reveal them in client code
- Close dev servers when testing is complete

## Environment Variables Required

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
DISCORD_WEBHOOK_URL
```

## Common Patterns to Follow

**When adding new meal log features:**
1. Update tRPC router with proper Zod validation
2. Ensure queries include food data if displaying food names
3. Add RLS policies for new tables
4. Update TypeScript types in `/lib/types/`

**When modifying food database:**
1. Create new migration file with `bunx supabase migration new`
2. Use proper data types: `NUMERIC` for vitamin K values, `food_category` enum
3. Include GIN indexes for searchable text fields

**When adding UI components:**
1. Follow Shadcn UI patterns from `/components/ui/`
2. Use Tailwind classes with `clsx` for conditional styling
3. Handle loading/error states with React Query patterns
4. Display actual food names using `meal.food?.name` pattern

## Documentation References

- Vercel Analytics documentation: https://vercel.com/docs/analytics/package