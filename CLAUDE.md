# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Maratron is a monorepo containing a full-stack running/fitness application:
```
maratron/
├── apps/
│   ├── web/          # Next.js web application with social features, run tracking, and AI chat
│   └── ai/           # Python MCP server providing AI-powered database tools and user context management
├── docs/             # Documentation
├── assets/           # Shared assets (logos, etc.)
├── Dockerfile        # Multi-service container
├── docker-compose.yml # Development orchestration
└── package.json      # Root workspace configuration
```

## Development Commands

### Docker Development (Recommended)
```bash
# Start everything with Docker Compose
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build --force-recreate
```

### Root Commands (Recommended)
```bash
npm run dev                      # Start with Docker Compose
npm run build                    # Build web application
npm run test                     # Run web tests
npm run test:ai                  # Run AI server tests
npm run lint                     # Lint web application
npm run db:studio               # Open Prisma Studio
npm run clean                   # Clean Docker environment
```

### 🧪 **Testing Protocol**
**IMPORTANT: When testing features, always use the full Docker stack:**

```bash
# 1. Start the complete environment (from repository root)
npm run dev    # Starts DB + web app + AI server in Docker

# 2. Test your features at http://localhost:3000

# 3. When finished, ALWAYS clean up Docker resources
npm run clean  # Stops containers and cleans up volumes
```

#### Use sub-agents:
  /Task "Start Docker environment" → Full setup + verification
  [test your features]
  /Task "Clean Docker environment" → Complete cleanup + reporting

**Why Docker for Testing:**
- Ensures consistent database state across tests
- AI server MCP integration requires proper networking
- Simulates production environment accurately
- Prevents port conflicts and dependency issues

### Local Development
```bash
# Terminal 1: Start AI server
cd apps/ai && python run_server.py 

# Terminal 2: Start web application  
cd apps/web && npm run dev
```

### Web Application (apps/web/)
```bash
npm install                      # Install dependencies
npm run dev                      # Development server with Turbopack
npm run build                    # Production build
npm run lint                     # ESLint validation
npm test                         # Jest test suites
npx prisma studio               # Database GUI
npx prisma generate             # Generate Prisma client
npx prisma db push              # Push schema changes
```

### AI Server (apps/ai/)
```bash
uv sync                         # Install dependencies with uv
python run_server.py            # Start MCP server
mcp dev server.py               # Start server with MCP Inspector UI
uv run pytest tests/unit/ -m unit          # Unit tests
uv run pytest tests/integration/ -m integration  # Integration tests
uv run pytest --cov=src --cov-report=html  # Test coverage
```

## Architecture Overview

### Integration Pattern
The web application communicates with the AI server through the Model Context Protocol (MCP):
- Web app uses MCP client (`src/lib/mcp/client.ts`) to connect to AI server
- AI server exposes database tools and user context management via MCP
- Real-time bidirectional communication for chat features

### Web Application (Next.js 15)
- **Tech Stack**: Next.js 15, TypeScript, PostgreSQL, Prisma, NextAuth.js, Tailwind CSS
- **Components**: Organized by feature (profile, runs, shoes, social, training, chat)
- **API Routes**: RESTful endpoints in `app/api/` for all data operations
- **Database**: Shared PostgreSQL database with Prisma ORM
- **Authentication**: NextAuth.js with credential provider

### AI Server (FastMCP)
- **Tech Stack**: Python 3.11+, FastMCP, asyncpg, Pydantic
- **User Context**: Session management with personalized responses
- **Security**: Rate limiting, UUID validation, input sanitization
- **Configuration**: Environment-aware settings with validation
- **Database**: Direct PostgreSQL access with connection pooling

### Shared Database Schema
Core entities across both applications:
- **Users**: Profile data, training preferences, VDOT calculations
- **Runs**: Distance, duration, pace, elevation tracking
- **Shoes**: Mileage tracking with retirement status
- **Social**: Profiles, posts, follows, groups, comments, likes
- **RunningPlans**: JSON-stored training plans

## Key Development Patterns

### MCP Integration
```typescript
// Web app connects to AI server
const mcpClient = getMCPClient();
await mcpClient.setUserContext(userId);  // Set user context
const result = await mcpClient.callTool({
  name: 'list_recent_runs',
  arguments: { limit: 5 }
});
```

### User Context Management
The AI server maintains user sessions for personalized responses:
```python
# Set user context (required first step)
await set_current_user_tool("user-uuid")
# All subsequent operations are user-aware
await list_recent_runs(5)  # Returns runs in user's preferred units
```

### Database Naming Convention
- Tables use PascalCase with quotes: `"Users"`, `"Runs"`, `"Shoes"`
- All primary keys are UUID (uuid.uuid4())
- Consistent relationship patterns across both codebases

### Running Calculations
Comprehensive running utilities in `apps/web/src/lib/utils/running/`:
- Jack Daniels VDOT calculations and race pace predictions
- Training plan generation (short/long distance)
- Pace conversions and weekly mileage calculations
- All functions have extensive test coverage

## Environment Setup

### Docker Environment (Recommended)
The Docker setup automatically handles database creation and application startup:
- PostgreSQL database runs in a separate container
- Both applications mount source code as volumes for live editing
- Database schema is automatically applied on startup
- All services are orchestrated with docker-compose

### Shared PostgreSQL Database
```env
# Both applications use the same database
DATABASE_URL="postgresql://maratron:yourpassword@localhost:5432/maratrondb"
```

### Web Application (.env)
```env
DATABASE_URL="postgresql://maratron:yourpassword@localhost:5432/maratrondb"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

### AI Server (.env)
```env
ENVIRONMENT=development
DATABASE_URL="postgresql://maratron:yourpassword@localhost:5432/maratrondb"
DATABASE__MIN_CONNECTIONS=1
DATABASE__MAX_CONNECTIONS=10
SERVER__DEBUG=true
SERVER__LOG_LEVEL=DEBUG
```

## Testing Strategy

### Web Application
- **Unit Tests**: Jest with React Testing Library
- **API Tests**: Route testing in `src/lib/api/__tests__/`
- **Utility Tests**: Comprehensive coverage in `src/lib/utils/__tests__/`
- **Component Tests**: Social features and forms in `src/components/__tests__/`

### AI Server
- **Unit Tests**: pytest with mocked database connections (`tests/unit/`)
- **Integration Tests**: Real database testing (`tests/integration/`)
- **Coverage**: 74% code coverage with HTML reports
- **Markers**: Use `-m unit`, `-m integration`, `-m slow` for test filtering

## Development Practices

### Code Organization
- **Web App**: Feature-based component organization with shadcn/ui components
- **AI Server**: Layered architecture with configuration, security, and context management
- **Shared Types**: Consistent TypeScript interfaces match database schema

### Package Management
- **Web App**: npm with package.json
- **AI Server**: uv (modern Python package manager) with pyproject.toml

### Security
- Input validation and sanitization across both applications
- Rate limiting in AI server (10 requests/minute per operation)
- Session management with 60-minute timeout
- Never commit secrets or API keys

### Database Access
- **Web App**: Prisma ORM with type-safe queries
- **AI Server**: Direct asyncpg with parameterized queries and connection pooling
- **Migrations**: Use Prisma migrations for schema changes

## MCP Server Tools & Resources

The AI server exposes comprehensive tools and resources through the Model Context Protocol:

### MCP Resources (AI-readable content)
**Database Schema & Information:**
- `database://schema` - Complete database schema and table structure
- `database://stats` - Database statistics and row counts

**User Profile Resources:**
- `users://profile/{user_id}` - Complete user profile information
- `user://profile` - Current user's profile (context-aware)

**Running Data Resources:**
- `runs://user/{user_id}/recent` - User's recent runs with detailed metrics
- `runs://user/{user_id}/summary/{period}` - Run summaries for specific periods
- `shoes://user/{user_id}` - User's shoe collection and usage data

### MCP Tools (AI-executable actions)

**Core Database Operations:**
- `add_user(name, email)` - Create new user accounts
- `update_user_email(user_id, email)` - Update user email addresses
- `delete_user(user_id)` - Remove users from system
- `add_run(user_id, date, duration, distance, ...)` - Record runs with comprehensive data
- `add_shoe(user_id, name, max_distance, ...)` - Add shoes to user collections

**User Context Management:**
- `set_current_user_tool(user_id)` - Initialize user session (required first step)
- `get_current_user_tool()` - Get current user profile and context
- `switch_user_context_tool(user_id)` - Switch between user contexts
- `clear_user_context_tool()` - Clear current user context
- `update_user_preferences_tool(preferences_json)` - Update user preferences
- `update_conversation_context_tool(context_json)` - Track conversation state
- `get_session_info_tool(user_id)` - Get session information
- `list_active_sessions_tool()` - List all active user sessions

**Smart Intelligence Tools:**
- `get_smart_user_context()` - Get comprehensive personalized context
- `analyze_user_patterns()` - Analyze running patterns and provide insights
- `get_motivational_context()` - Get context for encouraging responses
- `update_conversation_intelligence(...)` - Track conversation intelligence

### Security & Features

**Data Security:**
- Data isolation enforcement for all user-specific resources
- UUID validation and parameterized queries for SQL injection protection
- Rate limiting (10 requests/minute per operation)
- Session management with 60-minute timeout

**Personalization:**
- User preference caching (distance units, timezone, response detail)
- Conversation intelligence tracking (topics, mood, mentioned entities)
- Context-aware responses based on user history and preferences

**Usage Pattern:**
```python
# 1. Set user context (required first step)
await set_current_user_tool("user-uuid")

# 2. Access resources for AI understanding
user_profile = await read_resource("user://profile")
recent_runs = await read_resource("runs://user/{user_id}/recent")

# 3. Use tools for data operations
await add_run(user_id, "2024-01-15", "00:30:00", 5.0, "miles")

# 4. Leverage smart context for personalized responses
context = await get_smart_user_context()
insights = await analyze_user_patterns()
```

All tools are async, decorated with comprehensive error handling, and provide user context awareness for personalized AI interactions.

## Claude Code Development Tools

When working with Claude Code (claude.ai/code), the following MCP tools are available for enhanced development:

### Component Development
- **21st Magic Component Builder** (`mcp__magic__21st_magic_component_builder`) - Generate UI components with /ui command
- **21st Magic Component Inspiration** (`mcp__magic__21st_magic_component_inspiration`) - Browse component library for inspiration
- **21st Magic Component Refiner** (`mcp__magic__21st_magic_component_refiner`) - Improve existing UI components
- **Logo Search** (`mcp__magic__logo_search`) - Find company logos in JSX/TSX/SVG formats

### Library Documentation
- **Context7 Library Resolver** (`mcp__context7__resolve-library-id`) - Resolve package names to Context7 library IDs
- **Context7 Documentation** (`mcp__context7__get-library-docs`) - Fetch up-to-date library documentation

### Browser Automation
- **Puppeteer Navigation** (`mcp__puppeteer__puppeteer_navigate`) - Navigate to URLs
- **Puppeteer Screenshot** (`mcp__puppeteer__puppeteer_screenshot`) - Take page screenshots
- **Puppeteer Interactions** - Click, fill, select, hover, and evaluate JavaScript on pages

### Enhanced Thinking
- **Sequential Thinking** (`mcp__sequential-thinking__sequentialthinking`) - Multi-step problem-solving with reflection and revision

### Usage Examples

```bash
# Generate a new component with 21st Magic
/ui create a dashboard card component

# Search for library documentation
# First resolve library ID, then fetch docs
Context7: resolve "react-hook-form" -> get docs

# Take screenshots for testing/documentation
Puppeteer: navigate to localhost:3000 -> screenshot dashboard

# Complex problem solving with reflection
Sequential thinking: plan feature implementation with multiple revision cycles
```

These tools extend Claude Code's capabilities for modern web development, UI design, and automated testing workflows.