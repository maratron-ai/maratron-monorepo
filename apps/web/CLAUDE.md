# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Setup:**
```bash
npm install
```

**Development server:**
```bash
npm run dev    # Starts Next.js with Turbopack
```

**Build and testing:**
```bash
npm run build  # Production build
npm run lint   # ESLint validation
npm test       # Run Jest test suites
```

**Database:**
```bash
npx prisma studio           # Open Prisma Studio GUI
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema changes to database
```

## Architecture Overview

**Tech Stack:**
- Next.js 15 with App Router and TypeScript
- PostgreSQL with Prisma ORM
- NextAuth.js for authentication
- Tailwind CSS + shadcn/ui components
- Jest for testing

**Core Directory Structure:**
```
src/
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components organized by feature
│   ├── ui/                # shadcn/ui components
│   ├── profile/           # User profile components
│   ├── runs/              # Running activity components
│   ├── shoes/             # Shoe tracking components
│   ├── social/            # Social features components
│   └── training/          # Training plan components
├── lib/                   # Utilities and business logic
│   ├── api/               # API layer functions
│   ├── utils/             # Utility functions (with comprehensive tests)
│   └── schemas/           # Yup validation schemas
├── hooks/                 # Custom React hooks
└── maratypes/             # TypeScript type definitions
```

**Database Schema:**
- Users with comprehensive profile data (VDOT, training preferences, goals)
- Runs with pace, distance, elevation tracking
- Shoes with mileage tracking and retirement status
- RunningPlans with JSON plan data storage
- Social features: profiles, posts, follows, groups, comments, likes

**Path Aliases (tsconfig.json):**
- `@components/*` → `src/components/*`
- `@lib/*` → `src/lib/*`
- `@maratypes/*` → `src/maratypes/*`
- `@hooks/*` → `src/hooks/*`

## Key Running Utilities

**Core calculation functions in `src/lib/utils/running/`:**
- Jack Daniels VDOT calculations
- Pace conversions and race pace predictions
- Training plan generation (short/long distance)
- TCX file parsing for Garmin/fitness data import
- Weekly mileage calculations and run customization

**Testing:**
- Comprehensive test coverage for all utility functions
- Tests located in `src/lib/utils/__tests__/` and `src/lib/api/__tests__/`
- Component tests in `src/components/__tests__/`

## UI Guidelines

**Component Library:**
- Use shadcn/ui components exclusively for UI elements
- Lucide React for all icons
- Tailwind utility classes for styling

**Layout Pattern:**
```tsx
<div className="container mx-auto px-4 max-w-screen-lg">
  {/* Content */}
</div>
```

**Brand Colors:**
Available CSS variables include `--brand-from`, `--brand-to`, `--brand-orange`, `--brand-blue`, `--brand-purple`, plus standard theme colors like `--primary`, `--accent`, `--muted`.

**Typography:**
- Uses Inter font (`--font-inter` variable)
- Follow Tailwind typography scale (`text-base`, `text-xl`, etc.)

## Environment Setup

**Required environment variables:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

**Database setup:**
1. Create PostgreSQL user and database
2. Set DATABASE_URL in `.env` file  
3. Run `npx prisma db push` to sync schema
4. Use `npx prisma studio` for database management

## Development Practices

- TypeScript strict mode throughout
- Functional React components preferred
- Keep Prisma models synchronized with TypeScript types
- Test utility functions individually
- Run `npm run lint` and `npm test` before commits
- Follow existing code patterns and component structure