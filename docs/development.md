# 🚀 Maratron Development Guide

This comprehensive guide covers development setup, tools, workflows, and industry-standard practices for contributing to the Maratron project.

## 📋 Prerequisites

Before starting development, ensure you have:

- **Docker & Docker Compose** - For containerized development (recommended)
- **Node.js 20+** - For local development
- **Python 3.11+** - For AI server development  
- **Git** - Version control
- **VSCode** - Recommended IDE with extensions

### Recommended VSCode Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "charliermarsh.ruff",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## 🚀 Development Environment Setup

### Option 1: Full Containerization (Recommended for New Contributors)

```bash
# Clone repository
git clone https://github.com/maratron-ai/maratron-monorepo.git
cd maratron-monorepo

# Start complete development environment
npm run dev

# Access applications
# Web app: http://localhost:3000
# Database: localhost:5432 (postgres/maratron/yourpassword)
# Redis: localhost:6379
```

**Benefits**: 
- Consistent environment across all developers
- Automatic service discovery and networking
- No local dependency conflicts
- Production-like container setup

### Option 2: Hybrid Development (Recommended for Daily Development)

```bash
# Clone repository  
git clone https://github.com/maratron-ai/maratron-monorepo.git
cd maratron-monorepo

# Create environment file
cp apps/web/.env.example apps/web/.env

# Start databases in containers, app locally
npm run dev:hybrid

# Access applications
# Web app: http://localhost:3000 (local)
# Database: localhost:5432 (containerized)
# Redis: localhost:6379 (containerized)
```

**Benefits**:
- Fastest development with instant hot reload (<100ms)
- Native debugging and profiling support
- Full IDE integration
- Containerized data layer for consistency

### Option 3: Manual Setup (Advanced Users)

```bash
# Clone repository
git clone https://github.com/maratron-ai/maratron-monorepo.git
cd maratron-monorepo

# Install dependencies
npm install
cd apps/web && npm install && cd ../..
cd apps/ai && uv sync && cd ../..

# Setup environment variables
cp apps/web/.env.example apps/web/.env
# Edit .env with your local database and Redis URLs

# Setup database
cd apps/web
npx prisma db push
npm run db:seed
cd ../..

# Terminal 1: Start databases
docker-compose up postgres redis -d

# Terminal 2: Start AI server  
cd apps/ai && python run_server.py

# Terminal 3: Start web app
cd apps/web && npm run dev
```

## 🛠️ Development Commands

### Root Level Commands (Most Common)

```bash
# Development modes
npm run dev              # Full Docker stack (all containers)
npm run dev:hybrid       # Hybrid: containers for data, local for app (fastest)
npm run dev:web          # Local web app only  
npm run dev:ai           # Local AI server only

# Database operations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Load comprehensive test data (10 users, 27 shoes, 26 runs)
npm run db:seed:verbose  # Load seed data with detailed logging output
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate Prisma client types
npm run db:reset         # Reset database and re-seed

# Testing & quality
npm test                 # Run Jest test suite
npm run test:ai          # Run AI server tests with pytest
npm run lint             # ESLint validation
npm run build            # Production build with optimization

# Maintenance & debugging  
npm run clean            # Clean Docker environment (essential for troubleshooting)
npm run logs             # View all container logs
npm run logs -- web     # View specific service logs
```

### Web Application Commands

```bash
cd apps/web

# Development
npm run dev              # Next.js with Turbopack (blazingly fast)
npm run build            # Production build with optimizations
npm run start            # Start production server locally

# Testing
npm test                 # Run all Jest tests 
npm run test:watch       # Watch mode for active development
npm test -- --coverage  # Generate coverage report
npm test -- --testPathPattern=cache  # Run specific test categories

# Code quality
npm run lint             # ESLint with auto-fixable issues
npm run lint:fix         # ESLint with automatic fixes
npm run format           # Prettier formatting
npm run format:check     # Check formatting without changes

# Database
npm run db:seed          # Load comprehensive seed data
npm run db:seed:verbose  # Load seed data with detailed logging output
npm run db:studio        # Open Prisma Studio on localhost:5555
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create and apply new migration
```

### AI Server Commands

```bash
cd apps/ai

# Development
python run_server.py     # Start MCP server
mcp dev server.py        # Start with MCP Inspector UI
uv sync                  # Install/update dependencies

# Testing
uv run pytest                    # Run all tests
uv run pytest tests/unit/       # Unit tests only
uv run pytest tests/integration/ # Integration tests only  
uv run pytest --cov=src         # With coverage report
uv run pytest -v -s             # Verbose output with print statements

# Code quality
uv run ruff format       # Format code with Ruff
uv run ruff check        # Lint code with Ruff
uv run ruff check --fix  # Auto-fix linting issues
```

## 🛠️ Development Tools

### Pre-commit Hooks
We use Husky and lint-staged to maintain code quality:

```bash
# Automatically runs on git commit:
# - Prettier formatting for JS/TS/JSON/MD files
# - ESLint fixes for JS/TS files  
# - Ruff formatting for Python files
```

**Manual usage:**
```bash
# Format all files
npm run format

# Check formatting without fixing
npm run format:check

# Lint JavaScript/TypeScript
npm run lint
```

### Code Formatting

**Prettier Configuration:**
- Single quotes for JS/TS
- Semicolons enabled
- 80 character line width
- 2 space indentation
- Tailwind CSS class sorting

**Files automatically formatted:**
- `.js`, `.jsx`, `.ts`, `.tsx`
- `.json`, `.md`, `.yml`, `.yaml`

### Database Development

**Comprehensive Seed Data:**
```bash
# Load full development dataset
npm run db:seed

# Reset database and re-seed (destructive)
npm run db:reset

# Open Prisma Studio database GUI
npm run db:studio
```

**Development Dataset Includes:**
- **10 diverse users** with different training levels (beginner to Olympic Trials)
- **27 shoes** across various brands and categories  
- **26 recent runs** with comprehensive metrics (pace, elevation, heart rate)
- **Complete social graph** with posts, comments, likes, follows
- **Training plans** and group memberships
- **Realistic data patterns** for testing AI recommendations

**Test User Accounts** (password: "password"):
- `jackson@maratron.ai` - Advanced runner, VDOT 60, Boston qualifier
- `john@example.com` - Marathon enthusiast, VDOT 52, sub-3:30 goal
- `sarah@example.com` - Track specialist, VDOT 58, 5K/10K focus
- `mike@example.com` - Boston qualifier, VDOT 55, ultra ambitions
- `emily@example.com` - Beginner, VDOT 35, first marathon training
- Plus 5 more diverse profiles for comprehensive testing

**Schema Management:**
```bash
# Create new migration after schema changes
npx prisma migrate dev --name "descriptive-migration-name"

# Apply pending migrations
npx prisma migrate deploy

# Reset migrations (development only)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

## 🧪 Testing Strategy

### Web Application Testing

```bash
# Core testing commands
npm test                        # Run all Jest tests
npm run test:watch              # Watch mode for active development
npm test -- --coverage         # Generate coverage report

# Specific test categories
npm test -- --testPathPattern=cache      # Redis caching tests
npm test -- --testPathPattern=api        # API endpoint tests  
npm test -- --testPathPattern=utils      # Utility function tests
npm test -- --testPathPattern=components # React component tests

# Specific test files
npm test -- ChatInput           # Component-specific tests
npm test -- --testNamePattern="should handle cache miss" # Pattern matching

# Advanced testing options
npm test -- --watch --coverage # Watch with coverage
npm test -- --bail              # Stop on first failure
npm test -- --verbose           # Detailed test output
```

**Testing Categories:**
- **Component Tests** - React Testing Library for UI components
- **API Tests** - Endpoint validation and business logic
- **Utils Tests** - Core utility functions (VDOT, pace calculations, etc.)
- **Cache Tests** - Redis caching integration and fallback behavior
- **Integration Tests** - Cross-component functionality

### AI Server Testing

```bash
# Core testing commands
cd apps/ai
uv run pytest                           # Run all tests
uv run pytest --cov=src --cov-report=html # Generate HTML coverage report

# Test categories with markers
uv run pytest -m unit                   # Unit tests only (mocked dependencies)
uv run pytest -m integration            # Integration tests (real database)
uv run pytest -m slow                   # Long-running tests

# Specific test directories
uv run pytest tests/unit/               # Unit test suite
uv run pytest tests/integration/        # Integration test suite

# Advanced testing options
uv run pytest -v -s                     # Verbose with print statements
uv run pytest --tb=short                # Shorter traceback format
uv run pytest --failed-first            # Run failed tests first
uv run pytest --lf                      # Last failed tests only
```

**Testing Strategy:**
- **Unit Tests** - Individual function testing with mocked dependencies
- **Integration Tests** - Database operations and MCP tool functionality  
- **Fixtures** - Comprehensive test data setup and teardown
- **Async Testing** - Proper async/await pattern validation

### Performance Testing

```bash
# Performance monitoring endpoints
curl "http://localhost:3000/api/performance"           # Overall metrics
curl "http://localhost:3000/api/performance?action=cache"    # Cache statistics
curl "http://localhost:3000/api/performance?action=database" # Database metrics

# Load testing (development only)
ab -n 1000 -c 10 http://localhost:3000/api/users       # Apache Bench
hey -n 1000 -c 10 http://localhost:3000/api/performance # Hey load tester
```

### Test Data Management

```bash
# Reset to clean state for testing
npm run db:reset

# Load specific test scenarios
npm run db:seed

# Test with empty database
npx prisma migrate reset --force --skip-seed
```

## 📁 Project Structure

```
maratron-monorepo/
├── apps/
│   ├── web/                 # Next.js web application
│   │   ├── src/
│   │   │   ├── app/         # App Router pages and API routes
│   │   │   ├── components/  # React components
│   │   │   ├── lib/         # Utilities and business logic
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── maratypes/   # TypeScript types
│   │   ├── prisma/          # Database schema and seeds
│   │   └── tests/           # Test configuration
│   └── ai/                  # Python MCP server
│       ├── src/maratron_ai/ # Main application code
│       ├── tests/           # Test suite
│       └── scripts/         # Utility scripts
├── docs/                    # Documentation
└── .github/                 # CI/CD workflows
```

## 🔧 Development Commands

### Root Level Commands
```bash
npm run dev           # Start with Docker Compose
npm run dev:web       # Start web app only
npm run dev:ai        # Start AI server only
npm run build         # Build web application
npm run test          # Run web tests
npm run test:ai       # Run AI server tests
npm run lint          # Lint web application
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed development data
npm run clean         # Clean Docker environment
```

### Web Application Commands
```bash
cd apps/web
npm run dev           # Development server with Turbopack
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint validation
npm test              # Jest test suites
npm run format        # Format code with Prettier
npm run db:seed       # Seed database
npm run db:reset      # Reset and re-seed database
```

### AI Server Commands
```bash
cd apps/ai
uv sync               # Install dependencies
python run_server.py  # Start MCP server
mcp dev server.py     # Start with MCP Inspector UI
uv run pytest        # Run all tests
uv run ruff format    # Format code
uv run ruff check     # Lint code
```

## ⚡ Performance Monitoring & Debugging

### Performance Monitoring Endpoints

```bash
# Application health and metrics
curl "http://localhost:3000/api/performance"
# Returns: system health, memory usage, database stats, cache performance

# Detailed cache performance
curl "http://localhost:3000/api/performance?action=cache"  
# Returns: Redis health, hit rates, strategy performance, memory usage

# Database performance metrics
curl "http://localhost:3000/api/performance?action=database"
# Returns: connection pool, query performance, table stats, slow queries

# Simple health check
curl "http://localhost:3000/api/health"
# Returns: basic service health status
```

### Performance Benchmarks

**Expected Performance Targets:**
- **Cache Hit Rate**: >85% for user data, >90% for static data
- **API Response Time**: <100ms for cached endpoints, <500ms for uncached
- **Database Query Time**: <50ms average, <200ms for complex queries
- **Redis Operations**: >2000 ops/second
- **Memory Usage**: <512MB for web app container
- **Build Time**: <30 seconds with Turbopack

### Redis Cache Monitoring

```bash
# Monitor cache performance in real-time
watch -n 5 'curl -s "http://localhost:3000/api/performance?action=cache" | jq .cache.stats'

# Check specific cache strategy performance
curl "http://localhost:3000/api/performance?action=cache" | jq '.cache.cacheStrategies'

# Monitor Redis directly (if containerized)
docker exec -it maratron-redis redis-cli INFO stats
docker exec -it maratron-redis redis-cli MONITOR
```

### Database Performance Monitoring

```bash
# Monitor slow queries
curl "http://localhost:3000/api/performance?action=database" | jq '.database.recentSlowQueries'

# Check connection pool health
curl "http://localhost:3000/api/performance?action=database" | jq '.database.pool'

# Monitor database directly (if containerized)
docker exec -it maratron-postgres psql -U maratron -d maratrondb -c "SELECT * FROM pg_stat_activity;"
```

## 🎯 Development Best Practices

### Code Quality Standards

**TypeScript Best Practices:**
- **Strict Mode**: Always enabled with comprehensive type checking
- **No Any Types**: Use proper interfaces and union types instead
- **Type Safety**: Comprehensive interfaces in `maratypes/` directory  
- **Generic Usage**: Leverage generics for reusable components and functions

**React Development:**
- **Functional Components**: Use hooks instead of class components
- **Component Props**: Always define TypeScript interfaces for props
- **State Management**: Use React hooks and context for state
- **Performance**: Use React.memo, useMemo, useCallback appropriately
- **Testing**: Component tests with React Testing Library

**CSS & Styling:**
- **Tailwind First**: Use utility classes for styling
- **Component Variants**: Use cva (class-variance-authority) for component variants
- **Responsive Design**: Mobile-first responsive patterns
- **Accessibility**: ARIA labels and semantic HTML
- **Brand Consistency**: Use CSS custom properties for colors

**Python Development:**
- **Type Hints**: Comprehensive typing with mypy compatibility
- **Async Patterns**: Proper async/await usage throughout
- **Error Handling**: Comprehensive exception handling with logging
- **Code Organization**: Clear separation of concerns with modules
- **Testing**: High coverage with unit and integration tests

### Git Workflow & Branch Strategy

**Branch Strategy:**
```bash
main                    # Production-ready code, protected
├── develop             # Integration branch for features
├── feature/FEAT-123    # Feature branches from develop
├── fix/BUG-456         # Bug fixes from develop  
└── hotfix/HOTFIX-789   # Emergency fixes from main
```

**Commit Convention:**
```bash
# Format: type(scope): description
feat(api): add user profile caching endpoint
fix(ui): resolve mobile navigation issue
docs(readme): update development setup instructions
test(cache): add comprehensive cache invalidation tests
perf(db): optimize user runs query with indexing
```

**Development Flow:**
1. **Create Feature Branch**: `git checkout -b feature/FEAT-123 develop`
2. **Development**: Make changes with descriptive commits
3. **Pre-commit Validation**: Hooks run automatically (formatting, linting)
4. **Testing**: Run tests locally before pushing
5. **Push & PR**: Create pull request to develop branch
6. **Code Review**: Address feedback and approve
7. **CI/CD**: Automated testing and deployment
8. **Merge**: Squash and merge to develop

### Component Development Patterns

**shadcn/ui Integration:**
```typescript
// Use existing shadcn components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Extend with custom variants
const RunCard = ({ run, className, ...props }: RunCardProps) => {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)} {...props}>
      <CardHeader>
        <CardTitle>{run.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Run details */}
      </CardContent>
    </Card>
  )
}
```

**Component Testing Pattern:**
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react'
import { RunCard } from '@/components/runs/RunCard'

describe('RunCard', () => {
  const mockRun = {
    id: '1',
    name: 'Morning Run',
    distance: 5.0,
    duration: '00:30:00'
  }

  it('displays run information correctly', () => {
    render(<RunCard run={mockRun} />)
    expect(screen.getByText('Morning Run')).toBeInTheDocument()
    expect(screen.getByText('5.0 miles')).toBeInTheDocument()
  })
})
```

### API Development Standards

**Error Handling Pattern:**
```typescript
// Consistent error response structure
export async function GET(request: NextRequest) {
  try {
    const result = await performOperation()
    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
```

**Input Validation:**
```typescript
// Use Yup for comprehensive validation
import * as yup from 'yup'

const createRunSchema = yup.object({
  date: yup.date().required(),
  duration: yup.string().matches(/^\d{2}:\d{2}:\d{2}$/).required(),
  distance: yup.number().positive().required(),
  userId: yup.string().uuid().required()
})

// Validate in API route
const validatedData = await createRunSchema.validate(request.json())
```

### Cache Integration Best Practices

**Cache-First Pattern:**
```typescript
// Use cache manager for all data operations
import { cache } from '@/lib/cache/cache-manager'

export async function getUserRuns(userId: string, page: number = 1) {
  return await cache.user.runs(userId, page, 10, async () => {
    // This fallback only executes on cache miss
    return await prisma.run.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      skip: (page - 1) * 10
    })
  })
}
```

**Cache Invalidation Strategy:**
```typescript
// Invalidate related caches after mutations
export async function createRun(runData: CreateRunData) {
  const run = await prisma.run.create({ data: runData })
  
  // Invalidate related caches
  await cacheManager.invalidateByTags(['user', 'runs'])
  
  return run
}
```

### Database Development Patterns

**Schema Design Principles:**
- **UUID Primary Keys**: Use UUIDs for all primary keys
- **Audit Fields**: Include createdAt/updatedAt timestamps
- **Proper Indexing**: Index frequently queried fields
- **Referential Integrity**: Proper foreign key relationships
- **JSON Fields**: Use for flexible data storage (training plan data)

**Migration Best Practices:**
```bash
# Always backup before migrations in production
# Use descriptive migration names
npx prisma migrate dev --name "add-user-vdot-tracking"

# Test migrations on copy of production data
# Review generated SQL before applying
```

**Query Optimization:**
```typescript
// Use select to limit returned fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    VDOT: true,
    // Don't select password hash
  }
})

// Use include for necessary relations only
const userWithRuns = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    runs: {
      take: 10,
      orderBy: { date: 'desc' }
    }
  }
})
```

## 🔍 Debugging & Troubleshooting

### Web Application Debugging

**Development Tools:**
```bash
# Enable debug mode for detailed logging
DEBUG=true npm run dev

# Type checking without building
npx tsc --noEmit

# Analyze bundle size
npx @next/bundle-analyzer

# Check for unused dependencies
npx depcheck
```

**Browser Development:**
- **React DevTools** - Component inspection and profiling
- **Next.js DevTools** - Performance monitoring and bundle analysis
- **Prisma Studio** - Database inspection at `localhost:5555`
- **Network Tab** - API request/response debugging
- **Redux DevTools** - State management debugging (if using Redux)

**Common Web App Issues:**

1. **Module Resolution Errors**
   ```bash
   # Check tsconfig path mapping
   cat tsconfig.json | jq '.compilerOptions.paths'
   
   # Verify import paths use aliases correctly
   # ✅ import { cache } from '@lib/cache/cache-manager'
   # ❌ import { cache } from '../../../lib/cache/cache-manager'
   ```

2. **Build Failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear Turbopack cache
   rm -rf .next/cache
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connection
   npx prisma db push --preview-feature
   
   # Check environment variables
   echo $DATABASE_URL
   
   # Test connection with Prisma Studio
   npx prisma studio
   ```

### AI Server Debugging

**MCP Server Tools:**
```bash
# Start with MCP Inspector UI for debugging
cd apps/ai
mcp dev server.py

# Enable verbose logging
PYTHONPATH=src python -m maratron_ai.server --verbose

# Debug specific tools
uv run pytest tests/unit/test_tools.py -v -s

# Check database connectivity
python -c "
import asyncio
from maratron_ai.database.connection import get_db_connection
asyncio.run(get_db_connection().execute('SELECT NOW()'))
"
```

**Python Debugging:**
```python
# Add breakpoints for debugging
import pdb; pdb.set_trace()

# Or use IPython for better debugging
import IPython; IPython.embed()

# Enable detailed logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Common AI Server Issues:**

1. **Database Connection Failures**
   ```bash
   # Check environment variables
   echo $DATABASE_URL
   
   # Test connection manually
   python -c "import asyncpg; asyncio.run(asyncpg.connect('$DATABASE_URL'))"
   
   # Verify database container is running
   docker ps | grep postgres
   ```

2. **MCP Tool Registration Issues**
   ```bash
   # Check tool registration
   curl http://localhost:3001/mcp/tools
   
   # Verify tool functionality
   curl -X POST http://localhost:3001/mcp/call \
     -H "Content-Type: application/json" \
     -d '{"tool": "getUserRuns", "arguments": {"user_id": "test"}}'
   ```

3. **Import Errors**
   ```bash
   # Check Python path
   echo $PYTHONPATH
   
   # Install in development mode
   uv sync --dev
   
   # Verify package structure
   python -c "import maratron_ai; print(maratron_ai.__file__)"
   ```

### Docker & Container Debugging

**Container Health Monitoring:**
```bash
# Check all container status
docker-compose ps

# View container logs
docker-compose logs web
docker-compose logs postgres  
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f

# Check container resource usage
docker stats

# Inspect container configuration
docker inspect maratron-web
```

**Network Debugging:**
```bash
# Test container networking
docker exec -it maratron-web ping postgres
docker exec -it maratron-web ping redis

# Check port exposure
docker port maratron-web
docker port maratron-postgres
docker port maratron-redis

# Test service connectivity
docker exec -it maratron-web curl http://postgres:5432
```

**Volume and Data Issues:**
```bash
# Check volume mounts
docker volume ls
docker volume inspect maratron_postgres_data
docker volume inspect maratron_redis_data

# Clean up volumes (destructive)
docker-compose down -v
docker volume prune

# Backup data before cleanup
docker exec maratron-postgres pg_dump -U maratron maratrondb > backup.sql
```

### Performance Debugging

**Identifying Performance Bottlenecks:**
```bash
# Monitor API response times
curl -w "Total time: %{time_total}s\n" http://localhost:3000/api/users

# Profile database queries
curl "http://localhost:3000/api/performance?action=database" | jq '.database.performance'

# Monitor cache hit rates
curl "http://localhost:3000/api/performance?action=cache" | jq '.cache.stats.hitRate'

# Check memory usage
curl "http://localhost:3000/api/performance" | jq '.memory'
```

**Database Query Analysis:**
```sql
-- Enable query logging in PostgreSQL
SET log_statement = 'all';
SET log_min_duration_statement = 100; -- Log queries >100ms

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'Runs';
```

## 🚨 Common Troubleshooting Scenarios

### "Port Already in Use" Errors

```bash
# Find process using port 3000
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process using port
kill -9 $(lsof -ti :3000)

# Or use different port
PORT=3001 npm run dev
```

### Cache Not Working

```bash
# Check Redis connectivity
docker exec -it maratron-redis redis-cli ping

# Verify cache configuration
curl "http://localhost:3000/api/performance?action=cache"

# Check environment variables
echo $REDIS_ENABLED
echo $REDIS_HOST

# Clear cache for testing
docker exec -it maratron-redis redis-cli FLUSHALL
```

### Database Schema Issues

```bash
# Reset database to clean state
npx prisma migrate reset --force

# Apply pending migrations
npx prisma migrate deploy

# Generate fresh Prisma client
npx prisma generate

# Validate schema against database
npx prisma validate
```

### Environment Variable Issues

```bash
# Check if .env file exists and is readable
ls -la apps/web/.env
cat apps/web/.env

# Verify environment loading in app
echo "REDIS_ENABLED=$REDIS_ENABLED"
echo "DATABASE_URL=$DATABASE_URL"

# Check for environment conflicts
env | grep -E "(REDIS|DATABASE|NEXTAUTH)"
```

### Build and Deployment Issues

```bash
# Clean build artifacts
rm -rf .next apps/web/.next
rm -rf node_modules apps/web/node_modules

# Reinstall dependencies
npm install
cd apps/web && npm install

# Check for dependency conflicts
npm ls --depth=0
npx npm-check-updates

# Verify TypeScript compilation
npx tsc --noEmit --project apps/web
```

### MCP Integration Issues

```bash
# Test MCP server connectivity
curl http://localhost:3001/health

# Check available tools
curl http://localhost:3001/mcp/tools

# Test tool execution
curl -X POST http://localhost:3001/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "getUserContext", "arguments": {"user_id": "test-user"}}'

# Check AI server logs
docker-compose logs ai
```

## 🤝 Contributing Guidelines

### Pull Request Process

1. **Preparation**
   ```bash
   # Fork repository and clone
   git clone https://github.com/your-username/maratron-monorepo.git
   cd maratron-monorepo
   
   # Add upstream remote
   git remote add upstream https://github.com/maratron-ai/maratron-monorepo.git
   
   # Create feature branch
   git checkout -b feature/your-feature-name
   ```

2. **Development**
   ```bash
   # Make changes with descriptive commits
   git add .
   git commit -m "feat(component): add user profile caching"
   
   # Run tests and linting
   npm test
   npm run lint
   
   # Ensure all checks pass
   npm run build
   ```

3. **Pre-submission**
   ```bash
   # Update from upstream
   git fetch upstream
   git rebase upstream/develop
   
   # Push feature branch
   git push origin feature/your-feature-name
   ```

4. **Pull Request**
   - Create PR from your feature branch to `develop`
   - Include clear title and description
   - Reference related issues with `Fixes #123`
   - Add screenshots for UI changes
   - Ensure CI passes

### Code Review Checklist

**For Reviewers:**
- [ ] Code follows TypeScript and React best practices
- [ ] Tests are included for new functionality
- [ ] Documentation is updated if needed
- [ ] Performance impact is considered
- [ ] Security implications are evaluated
- [ ] Cache invalidation is properly handled
- [ ] Error handling is comprehensive

**For Contributors:**
- [ ] Pre-commit hooks pass (formatting, linting)
- [ ] All tests pass locally
- [ ] Build succeeds without warnings
- [ ] Documentation reflects changes
- [ ] Breaking changes are clearly marked
- [ ] Performance benchmarks are maintained

### Issue Reporting

**Bug Reports Should Include:**
- Clear reproduction steps
- Expected vs actual behavior
- Environment details (OS, Node version, Docker version)
- Relevant log output
- Screenshots for UI issues

**Feature Requests Should Include:**
- Clear problem statement
- Proposed solution
- Alternative approaches considered
- Implementation considerations
- Impact on existing functionality

---

## 📚 Additional Resources

### Documentation Links
- **[Performance Monitoring Guide](./performance-monitoring.md)** - Enterprise-grade monitoring and optimization
- **[Production Deployment Guide](./production-deployment.md)** - Complete production deployment guide
- **[API Reference](./api-reference.md)** - Complete endpoint documentation
- **[Architecture Overview](./architecture.md)** - System design and patterns
- **[Redis Caching Guide](./redis-caching.md)** - Caching implementation details
- **[MCP-LLM Integration](./mcp-llm-integration.md)** - AI system architecture

### External Resources
- **[Next.js 15 Documentation](https://nextjs.org/docs)** - Framework documentation
- **[Prisma Documentation](https://www.prisma.io/docs)** - Database ORM guide
- **[shadcn/ui Components](https://ui.shadcn.com)** - UI component library
- **[Model Context Protocol](https://modelcontextprotocol.io)** - MCP specification
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling framework
- **[FastMCP](https://github.com/jlowin/fastmcp)** - Python MCP framework

### Development Communities
- **[Next.js Discord](https://discord.com/invite/bUG2bvbtHy)** - Next.js community support
- **[Prisma Discord](https://discord.com/invite/prisma)** - Database and ORM discussions
- **[MCP Discord](https://discord.com/invite/modelcontextprotocol)** - MCP development support

---

*For additional support, open an issue on GitHub or check the comprehensive documentation in the `docs/` directory.*