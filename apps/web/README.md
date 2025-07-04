# Maratron Web Application

The Next.js frontend for the Maratron AI-powered running and fitness platform. Features comprehensive run tracking, social networking, training plans, and intelligent AI chat powered by MCP integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Redis (optional, for caching)

### Development Options

**🐳 Containerized Development (Recommended)**
```bash
# From repository root - complete Docker environment
npm run dev    # Starts PostgreSQL + Redis + Web App + AI Server
```
- **Benefits**: Production-like environment, zero configuration
- **Access**: http://localhost:3000
- **Services**: PostgreSQL (5432), Redis (6379), AI Server (MCP)

**⚡ Local Development**
```bash
# From apps/web directory
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

### Environment Configuration

Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://maratron:yourpassword@localhost:5432/maratrondb"

# Authentication  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here

# AI Integration
ANTHROPIC_API_KEY=your_anthropic_key_here

# Redis Caching (Optional)
REDIS_URL=redis://localhost:6379
```

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis with intelligent cache management
- **UI**: Tailwind CSS with shadcn/ui components
- **Authentication**: NextAuth.js
- **AI Integration**: MCP (Model Context Protocol) with Claude

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── (pages)/           # Page components
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
└── maratypes/            # TypeScript type definitions
```

## 🧠 AI Integration

**Advanced MCP-LLM Integration**
- **12 intelligent tools** for personalized running advice
- **Auto context management** from user sessions
- **Multi-tool coordination** for complex analysis
- **Natural UX** with no technical details exposed

📖 **[Complete AI Documentation →](../../docs/mcp-llm-integration.md)**

## 🎯 Key Features

### Core Functionality
- **Run Tracking**: GPS data, pace analysis, elevation tracking
- **Training Plans**: AI-generated plans based on VDOT methodology
- **Social Features**: Posts, comments, groups, leaderboards
- **Shoe Management**: Mileage tracking and replacement recommendations
- **Performance Analytics**: Trends, predictions, and insights

### AI Chat Features
- **Personalized Advice**: Based on your actual run data
- **Training Recommendations**: Adaptive plans and goal setting
- **Performance Analysis**: Data-driven insights and predictions
- **Equipment Guidance**: Shoe rotation and gear recommendations

## 🧪 Testing

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Structure
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API route and database testing
- **Performance Tests**: Load testing and cache validation

**Current Coverage**: 378 tests passing across 51 test suites

## 🔧 Development

### Commands Reference
```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run lint            # Code linting
npm run type-check      # TypeScript checking

# Database
npx prisma studio       # Database GUI
npx prisma generate     # Update Prisma client
npx prisma db push      # Push schema changes

# Testing
npm test               # Run all tests
npm run test:coverage  # Coverage report
```

### Performance Features
- **Redis Caching**: 2000+ ops/sec, <2ms response times
- **Database Optimization**: Indexed queries, connection pooling
- **Bundle Optimization**: Route-based code splitting
- **Image Optimization**: Next.js automatic optimization

For complete development workflows and environment setup, see **[Development Guide](../../docs/development.md)**.

For system architecture details, see **[Architecture Overview](../../docs/architecture.md)**.