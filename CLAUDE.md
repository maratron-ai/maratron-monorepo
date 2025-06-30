# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 Critical Context (Read First)

### Project Status & Current Focus
- **Status**: Production-ready full-stack running/fitness platform with AI chat
- **Architecture**: Hybrid MCP integration (Docker + local modes)
- **Test Coverage**: Comprehensive test suite with continuous expansion
- **Active Development**: Focus on feature expansion and AI enhancement

### Key Architectural Decisions
- **Docker-First Development**: Primary workflow uses `npm run dev` (Docker Compose)
- **Hybrid Database Access**: Docker uses direct Prisma, local uses MCP client
- **Intelligent AI**: Query routing determines when to fetch user data vs general advice
- **Environment Detection**: Automatic switching via `isDockerEnvironment()`

### Known Critical Points
- **MCP Integration**: Requires environment-aware code paths
- **Database Access**: Different patterns for Docker vs local environments
- **Complex Domain Logic**: Running science with VDOT, pace zones, training plans
- **Testing Strategy**: Docker cleanup essential to prevent state leakage

## ⚡ Quick Reference

### Essential Commands (Priority Order)
```bash
# Primary development workflow
npm run dev                    # Start Docker Compose stack (primary)
npm run clean                  # Clean Docker environment (essential)
npm run db:seed               # Load comprehensive test data

# Testing & validation
npm test                      # Web app tests (all current tests)
npm run test:ai               # AI server tests with pytest
npm run lint                  # Code quality validation

# Database operations
npm run db:studio             # Prisma Studio GUI
npx prisma db push            # Push schema changes
npx prisma generate           # Regenerate Prisma client
```

### Critical File Locations
```
🔧 Core Architecture
├── docker-compose.yml              # Primary development orchestration
├── apps/web/src/lib/mcp/client.ts  # MCP client integration
├── apps/web/src/lib/database/direct-access.ts  # Docker bypass logic
└── apps/web/prisma/schema.prisma   # Database schema (278 lines)

🧠 AI Intelligence
├── apps/web/src/lib/utils/chat-query-routing.ts  # Query intelligence
├── apps/web/src/app/api/chat/chat-handler.ts     # Business logic
└── apps/ai/src/maratron_ai/user_context/         # AI context management

🏃 Domain Logic
├── apps/web/src/lib/utils/running/               # Running calculations
├── apps/web/src/lib/utils/running/jackDaniels.ts # VDOT methodology
└── apps/web/src/lib/utils/running/plans/         # Training plan generation

🧪 Testing
├── apps/web/src/**/__tests__/                    # Jest tests (expanding)
├── apps/ai/tests/unit/                          # Python unit tests
└── apps/ai/tests/integration/                   # Python integration tests
```

### Path Aliases & Import Patterns
```typescript
@lib/          -> src/lib/
@components/   -> src/components/
@utils/        -> src/lib/utils/
@maratypes/    -> src/maratypes/
@hooks/        -> src/hooks/
```

## 🧠 LLM Decision Trees

### Environment Detection Pattern
```typescript
// Always check environment before database operations
const isDocker = isDockerEnvironment();
if (isDocker) {
  // Use direct Prisma database access
  userData = await getUserDataDirect(userId, dataTypes);
} else {
  // Use MCP client connection
  userData = await gatherUserData(dataTypes, userId, mcpClient);
}
```

### Query Intelligence Routing
```typescript
// Determine if user query needs personalized data
const queryAnalysis = needsUserData(userMessage);
if (queryAnalysis.requiresData) {
  // Fetch actual user data for personalized response
  // LLM gets detailed run/shoe data instead of generic advice
} else {
  // Provide general running advice
}
```

### Testing Strategy Decision
```
Adding new feature →
1. Write tests first (TDD approach)
2. Place in appropriate __tests__ directory
3. Use Jest for web app, pytest for AI server
4. Add markers for AI tests: -m unit, -m integration, -m slow
5. Ensure Docker cleanup after integration tests
```

## 🔧 Development Workflows

### Adding New Features
1. **Environment Setup**: Start with `npm run dev` (Docker)
2. **Database Changes**: Edit `prisma/schema.prisma` → `npx prisma db push`
3. **AI Integration**: Consider query routing in `chat-query-routing.ts`
4. **Testing**: Add tests in appropriate `__tests__/` directory
5. **Types**: Update types in `maratypes/` if needed

### Working with MCP Integration
```typescript
// Web app (apps/web/src/lib/mcp/client.ts)
const mcpClient = getMCPClient();
await mcpClient.setUserContext(userId);

// AI server (apps/ai/src/maratron_ai/user_context/tools.py)
@mcp.tool()
async def get_smart_user_context() -> str:
    # Returns comprehensive user context for AI
```

### Running Domain Patterns
```typescript
// VDOT calculations (apps/web/src/lib/utils/running/jackDaniels.ts)
const vdot = calculateVDOTFromRace(distance, time);
const paces = calculateRacePaces(vdot);

// Training plans (apps/web/src/lib/utils/running/plans/)
const plan = generateLongDistancePlan(goalRace, currentFitness, weeks);
```

### Database Patterns
```typescript
// Prisma queries (web app)
const runs = await prisma.run.findMany({
  where: { userId },
  orderBy: { date: 'desc' },
  include: { user: true }
});

// Direct queries (AI server)
async with get_db_connection() as conn:
    runs = await conn.fetch(
        'SELECT * FROM "Runs" WHERE "userId" = $1 ORDER BY date DESC',
        user_id
    )
```

## 🧪 Testing Patterns

### Web Application Testing
```bash
# Run all tests
npm test

# Run specific test files
npm test -- src/lib/utils/__tests__/chat-query-routing.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### AI Server Testing
```bash
# Unit tests (mocked database)
uv run pytest tests/unit/ -m unit

# Integration tests (real database)
uv run pytest tests/integration/ -m integration

# Coverage report
uv run pytest --cov=src --cov-report=html

# Specific test markers
uv run pytest -m slow  # Long-running tests
```

### Test Data & Seeding
```bash
# Load comprehensive test data (run from apps/web)
npm run db:seed

# Includes:
# - 10 diverse users (beginner to Olympic Trials level)
# - 27 shoes across various brands
# - 26 recent runs with comprehensive metrics
# - Complete social graph (posts, comments, likes, follows)
# - Training plans and group memberships
```

## 🚨 Common Issues & Solutions

### Docker Environment Issues
```bash
# Container conflicts
npm run clean && npm run dev

# Database connection issues
docker-compose logs postgres
docker-compose restart postgres

# Volume permissions
docker-compose down -v
docker system prune -f
```

### MCP Integration Failures
```typescript
// Check environment first
if (!isDockerEnvironment()) {
  try {
    mcpClient = getMCPClient();
    // Use MCP tools
  } catch (error) {
    // Fallback to direct database access
  }
}
```

### Jest Path Resolution
```javascript
// Common issue: Module resolution fails
// Solution: Use path aliases defined in jest.config.js
import { needsUserData } from '@lib/utils/chat-query-routing';
// Instead of: '../../../lib/utils/chat-query-routing'
```

### Database Schema Changes
```bash
# After editing schema.prisma
npx prisma db push      # Push changes to database
npx prisma generate     # Regenerate client types
npm run test           # Verify tests still pass
```

## 🏗️ Architecture Deep Dive

### Monorepo Structure
```
maratron-monorepo/
├── apps/
│   ├── web/          # Next.js 15 app with Turbopack
│   └── ai/           # FastMCP Python server
├── assets/           # Shared brand assets
├── docs/             # Comprehensive documentation
└── package.json      # Root workspace configuration
```

### Database Schema Key Entities
- **Users**: Core profiles with training preferences, VDOT calculations
- **Runs**: Comprehensive tracking (distance, pace, elevation, GPS, heart rate)
- **Shoes**: Mileage tracking with retirement management
- **Social**: Posts, comments, likes, follows, groups, run sharing
- **Training**: Plans with progressive overload and periodization

### AI Integration Architecture
```
User Chat Query →
├── Query Intelligence (needsUserData) →
├── Environment Detection (isDockerEnvironment) →
├── Data Fetching (getUserDataDirect OR gatherUserData) →
├── Enhanced System Prompt (createPersonalizedPrompt) →
└── LLM Response with actual user data
```

## 🎯 Code Quality Standards

### TypeScript Patterns
- **Strict Mode**: No `any` types in production code
- **Type Safety**: Comprehensive interfaces in `maratypes/`
- **Error Handling**: Result types and graceful degradation

### Testing Expectations
- **TDD Approach**: Write tests first for new features
- **Coverage**: Maintain comprehensive test coverage
- **Markers**: Use pytest markers for AI server tests
- **Cleanup**: Always clean Docker state after integration tests

### File Organization
- **Feature-Based**: Components organized by domain (runs, shoes, social)
- **Utility Functions**: Extensively tested in `lib/utils/`
- **API Routes**: RESTful design with consistent error handling
- **Types**: Centralized in `maratypes/` matching database schema

## 📚 Domain Knowledge Context

### Running Science Concepts
- **VDOT**: Jack Daniels' fitness metric for training pace prescription
- **Progressive Overload**: Gradual training load increases
- **Periodization**: Training phases (base building, sharpening, peak, recovery)
- **Pace Zones**: Easy, threshold, interval, repetition paces

### Training Plan Logic
- **Base Building**: 80% easy pace, 20% threshold work
- **Cutback Weeks**: Every 4th week reduces volume 25-30%
- **Peak Phases**: Higher intensity, reduced volume
- **Taper**: 2-3 weeks before goal race

### Social Features
- **User Profiles**: Public running stats and achievements
- **Run Sharing**: Post runs with photos, routes, metrics
- **Group Training**: Join local running groups and challenges
- **Motivation**: Comment, like, and encourage other runners

## 🚀 Production Considerations

### Performance Patterns
- **Database Optimization**: Proper indexing on user queries
- **Connection Pooling**: Configured for both Prisma and asyncpg
- **Image Optimization**: Next.js automatic optimization
- **Bundle Splitting**: Route-based code splitting

### Security Implementation
- **Authentication**: NextAuth.js with secure session management
- **Data Isolation**: User-specific data access enforcement
- **Input Validation**: Yup schemas and server-side sanitization
- **Rate Limiting**: AI server operations limited to prevent abuse

### Deployment Architecture
- **Docker Production**: Multi-stage builds for optimization
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Prisma-managed schema evolution
- **Error Monitoring**: Comprehensive logging and error tracking

## 💡 LLM Collaboration Notes

### When Adding Tests
- Place in appropriate `__tests__/` directory
- Follow existing naming conventions
- Use React Testing Library for components
- Add pytest markers for AI server tests
- Test both happy path and error conditions

### When Modifying AI Features
- Consider both Docker and local environments
- Update query routing patterns if needed
- Test with seed data users for realistic scenarios
- Verify graceful fallback behavior

### When Working with Database
- Always use proper TypeScript types
- Consider both web app (Prisma) and AI server (asyncpg) access patterns
- Test schema changes thoroughly
- Update seed data if new entities are added

### When Debugging Issues
- Check environment detection first
- Verify Docker container health
- Test with clean environment (`npm run clean`)
- Use comprehensive logging for troubleshooting