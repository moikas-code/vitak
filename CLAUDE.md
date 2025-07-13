# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- Format each individual memory as a bullet point and group related memories under descriptive markdown headings.

- Perform a web search if you need more information

- Create a Task in the KB when making a plan to keep track between sessions

- Never use placeholder logic when writing logic; provide a full solution

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
bun push:migration   # Push migration to local DB
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
- Always use `bun new:migration` to create new migrations for supabase
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


## File Organization

### Directory Structure

- **Root**: Only config files, build files
- **tests/**: All test files and fixtures organized by type
- **examples/**: Demo programs and tutorials
- **kb/**: Knowledge base, documentation (see KB Organization below)
- **tools/**: Development utilities and maintenance scripts


## KB (Knowledge Base) Organization

The `kb/` directory follows a specific structure for tracking project state:

### KB Directory Structure

```
kb/
├── active/          # Current work and open issues
├── completed/       # Resolved issues and finished work
├── status/          # Overall project status tracking
├── development/     # Development guides and standards
├── architecture/    # Design decisions and architecture docs
├── guides/          # How-to guides and tutorials
├── references/      # External references and resources
├── planning/        # Future plans and roadmaps
├── reports/         # Analysis and investigation reports
├── notes/           # Miscellaneous notes and observations
└── legacy/          # Deprecated or historical documents
```

### What Goes Where

#### `active/` - Current Work

- Open issues and bugs (e.g., KNOWN_ISSUES.md)
- In-progress implementations
- Current investigation reports
- Active todo lists and tasks
- **Move to `completed/` when resolved**

#### `completed/` - Resolved Work

- Closed issues with resolution details
- Completed feature implementations
- Finished investigation reports
- Resolved security audits
- **Include resolution date and summary**

#### `status/` - Project Status

- Overall implementation status (OVERALL_STATUS.md)
- Component-specific status reports
- Production readiness assessments
- Compliance status tracking
- **Keep continuously updated**

#### `development/` - Development Resources

- Coding standards and guidelines
- Testing standards (e.g., CLOSURE_TESTING_STANDARDS.md)
- Implementation guides
- Best practices documentation
- **Reference documents for developers**

#### Other Directories

- **architecture/**: Design decisions, system architecture
- **guides/**: Step-by-step tutorials, how-to guides
- **references/**: Links to external docs, resources
- **planning/**: Roadmaps, future feature plans
- **reports/**: Investigation results, analysis reports
- **notes/**: Quick notes, observations, ideas
- **legacy/**: Old/deprecated docs kept for reference

## CLI Commands

### Security and Optimization

- `/audit` - Perform a Security (SOC2 Compliant), and Optimization Audit of the provided file or files; Ensure they are ready for Production.
- `/implement` - Implement a production-ready implementation of the provided text; Refer to and update the @kb documentation for tracking and guidance
- `/scan` - Audit the entire codebase, create any issue that have been added to the KB, and report back on the completion status of the project;

### Available MCP Tools

- `kb_read` - Read any KB file (e.g., "active/KNOWN_ISSUES.md")
- `kb_list` - Browse KB directory structure
- `kb_update` - Create/update KB files
- `kb_delete` - Delete KB files
- `kb_search` - Search KB content
- `kb_status` - Get implementation status overview
- `kb_issues` - Get current known issues

### Usage Examples

- "Show me the current implementation status" → Uses `kb_status`
- "What are the known issues?" → Uses `kb_issues`
- "Update the roadmap with this milestone" → Uses `kb_update`
- "Search for async implementation details" → Uses `kb_search`
