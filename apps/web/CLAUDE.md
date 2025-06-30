# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 **NEW: Advanced MCP-LLM Integration** 

The chatbot now uses **Claude 3.5 Function Calling** with 9 intelligent tools for personalized running advice:
- **Auto Context Management**: User context set automatically from session
- **Real-Time Tool Selection**: Claude intelligently chooses relevant tools
- **Natural UX**: No technical details exposed to users
- **Multi-Tool Coordination**: Complex analysis uses multiple tools simultaneously

📖 **[Complete Technical Documentation →](../../docs/MCP_LLM_INTEGRATION.md)**

## Development Commands

**Setup:**
```bash
npm install
```

**Development server:**
```bash
npm run dev    # Starts Next.js with Turbopack
```

**Full Stack Development (Recommended for Testing):**
```bash
# From repository root - starts Docker containers for DB, web app, and AI server
npm run dev    # Equivalent to: docker-compose up --build

# When finished testing, always clean up:
npm run clean  # Equivalent to: docker-compose down
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

**MCP Integration:**
- MCP client (`src/lib/mcp/client.ts`) for AI server communication
- Real-time bidirectional communication through Model Context Protocol
- User context management for personalized AI responses
- Access to comprehensive database tools and smart analytics

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

## MCP Client Integration

The web application integrates with the AI server through a comprehensive MCP client:

**Client Setup (`src/lib/mcp/client.ts`):**
```typescript
// Connect to AI server
const mcpClient = getMCPClient();
await mcpClient.connect();

// Set user context for personalized responses
await mcpClient.setUserContext(userId);

// Access AI server resources
const userProfile = await mcpClient.readResource('user://profile');
const recentRuns = await mcpClient.readResource('runs://user/{userId}/recent');

// Execute AI server tools
const result = await mcpClient.callTool({
  name: 'add_run',
  arguments: { 
    user_id: userId, 
    date: '2024-01-15', 
    duration: '00:30:00',
    distance: 5.0,
    distance_unit: 'miles' 
  }
});
```

**Available MCP Features:**
- **Resources**: Read user profiles, run data, shoe collections from AI server
- **Tools**: Create runs, manage shoes, analyze patterns through AI server
- **Context Management**: Set user context for personalized AI interactions
- **Smart Analytics**: Access AI-powered insights and motivational content
- **Session Management**: Track user sessions and conversation intelligence

**Integration Points:**
- Chat interface (`src/components/chat/`) uses MCP for AI responses
- Run tracking components leverage MCP tools for data operations
- User profile components sync with MCP user context management
- Training plan generation utilizes MCP pattern analysis tools

## Development Practices

- TypeScript strict mode throughout
- Functional React components preferred
- Keep Prisma models synchronized with TypeScript types
- Test utility functions individually
- Run `npm run lint` and `npm test` before commits
- Follow existing code patterns and component structure
- **MCP Integration**: Always set user context before using MCP tools
- **Error Handling**: Handle MCP connection failures and tool errors gracefully