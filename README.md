# VitaK Tracker

A Progressive Web App (PWA) for managing Vitamin K intake for warfarin patients using a credit-based tracking system.

## Features

- **Credit-Based System**: Daily, weekly, and monthly Vitamin K credits
- **Food Database**: Comprehensive database with accurate Vitamin K content
- **Visual Tracking**: Real-time progress indicators and alerts
- **PWA**: Works offline and can be installed as an app
- **Secure Authentication**: Powered by Clerk

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **API**: tRPC
- **State Management**: Zustand
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- Clerk account
- Supabase account

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Installation

```bash
# Install dependencies
bun install

# Run database migrations in Supabase dashboard
# Copy contents of supabase/migrations/001_initial_schema.sql

# Start development server
bun dev
```

### Build for Production

```bash
bun run build
bun start
```

## Project Structure

```
vitak/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── dashboard/        # Dashboard-specific components
├── lib/                   # Utilities and configuration
│   ├── hooks/            # Custom React hooks
│   ├── trpc/             # tRPC setup and routers
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── public/               # Static assets
└── supabase/             # Database migrations
```

## Key Features Implementation

### Credit System
- Users set daily/weekly/monthly Vitamin K limits
- Credits are automatically calculated and tracked
- Visual indicators show current status

### Food Database
- Pre-populated with common foods
- Searchable by name and category
- Portion size calculator

### PWA Features
- Offline functionality
- Installable on mobile and desktop
- Push notifications (future enhancement)

## License

MIT