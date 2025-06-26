# Maratron - AI-Powered Running & Fitness Platform

A full-stack running and fitness application with AI-powered features, social networking, and comprehensive training tools.

## 🏗️ Architecture

```
maratron-monorepo/
├── apps/
│   ├── web/          # Next.js web application
│   └── ai/           # Python MCP server
├── assets/           # Shared assets (logos, etc.)
├── Dockerfile        # Multi-service container
├── docker-compose.yml # Development orchestration
└── package.json      # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Development with Docker (Recommended)
```bash
# Clone and start everything
git clone https://github.com/maratron-ai/maratron-monorepo.git
cd maratron-monorepo
npm run dev  # Starts Docker Compose

# View logs
npm run logs

# Clean restart
npm run clean && npm run dev
```

### Local Development
```bash
# Terminal 1: Start database
docker-compose up postgres

# Terminal 2: Start AI server
cd apps/ai
uv sync
python run_server.py

# Terminal 3: Start web application
cd apps/web
npm install
npm run dev
```

## 🏃‍♂️ Applications

### Web Application (`apps/web/`)
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **Features**: Run tracking, social feeds, training plans, AI chat

### AI Server (`apps/ai/`)
- **Framework**: FastMCP (Model Context Protocol)
- **Database**: Direct PostgreSQL with asyncpg
- **Features**: User context management, intelligent responses, database tools
- **Package Manager**: uv (modern Python package management)

## 🛠️ Development Commands

```bash
# Root level commands
npm run dev           # Start with Docker
npm run build         # Build web application
npm run test          # Run web tests
npm run test:ai       # Run AI server tests
npm run lint          # Lint web application
npm run db:studio     # Open Prisma Studio
npm run clean         # Clean Docker environment

# Web application (apps/web/)
cd apps/web
npm run dev           # Development server
npm run build         # Production build
npm test              # Jest tests
npx prisma studio     # Database GUI

# AI server (apps/ai/)
cd apps/ai
uv sync               # Install dependencies
python run_server.py  # Start MCP server
uv run pytest        # Run tests
```

## 🗄️ Database

### Automatic Setup
- PostgreSQL runs in Docker container
- Schema automatically applied on startup
- Sample data populated for development
- Prisma Studio available via `npm run db:studio`

### Manual Operations
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:studio     # Open database GUI
```

## 🔧 Environment Variables

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
SERVER__DEBUG=true
```

## 🧪 Testing

### Web Application
```bash
cd apps/web
npm test              # Unit tests with Jest
npm run test:watch    # Watch mode
```

### AI Server
```bash
cd apps/ai
uv run pytest tests/unit/        # Unit tests
uv run pytest tests/integration/ # Integration tests
uv run pytest --cov=src         # With coverage
```

## 📚 Key Features

### Running & Training
- **Run Tracking**: Distance, pace, heart rate, elevation
- **Shoe Management**: Mileage tracking and retirement alerts
- **Training Plans**: AI-generated plans based on goals and VDOT
- **VDOT Calculations**: Jack Daniels running calculator integration

### Social Features
- **User Profiles**: Customizable running profiles
- **Run Groups**: Create and join running communities
- **Social Feed**: Share runs and interact with other runners
- **Comments & Likes**: Engage with the running community

### AI Integration
- **Intelligent Chat**: Context-aware running advice
- **Personalized Responses**: Based on user preferences and history
- **Database Integration**: AI can access and analyze your running data
- **MCP Protocol**: Modern AI-to-application communication

## 🔐 Security

- Input validation and sanitization
- Rate limiting on AI operations
- Session management with timeouts
- Environment-based configuration
- No secrets in codebase

## 📖 Documentation

- `CLAUDE.md` - Development guidance for AI assistants
- `apps/web/CLAUDE.md` - Web application details
- `apps/ai/CLAUDE.md` - AI server documentation


## 📄 License

MIT License - see LICENSE file for details