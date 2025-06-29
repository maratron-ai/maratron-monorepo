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

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Architecture Overview](docs/architecture.md)** - System design and component relationships
- **[Web Application](docs/web-app.md)** - Next.js frontend with social features and run tracking  
- **[AI MCP Server](docs/ai-server.md)** - Python MCP server with database tools and context management
- **[API Reference](docs/api-reference.md)** - Complete API documentation
- **[Development Guide](docs/development.md)** - Setup, testing, and contribution guidelines

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

## 🤖 Claude Code Development Tools

[SuperClaude](https://github.com/NomenAK/SuperClaude/tree/master) was used as a pair coder. See flag usage [here](https://github.com/NomenAK/SuperClaude/blob/master/.claude/commands/shared/flag-inheritance.yml)

When working with [Claude Code](https://docs.anthropic.com/en/docs/claude-code), the following MCP tools are available for enhanced development:

### 🎨 Component Development
- **[21st Magic Component Builder](https://github.com/21st-dev/magic-mcp)** - Generate UI components with `/ui` command
  - **Documentation**: [21st.dev/magic](https://21st.dev/magic)
  - **Usage**: `/ui create a dashboard card component`
  - **Integration**: Works with [shadcn/ui](https://ui.shadcn.com/) components

- **[21st Magic Component Inspiration](https://github.com/21st-dev/magic-mcp)** - Browse component library for inspiration
  - **Usage**: `/21st fetch` to explore existing components
  
- **[21st Magic Component Refiner](https://github.com/21st-dev/magic-mcp)** - Improve existing UI components
  - **Usage**: `/ui refine` to enhance component design and functionality

- **[Logo Search](https://github.com/21st-dev/magic-mcp)** - Find company logos in JSX/TSX/SVG formats
  - **Usage**: `/logo GitHub` to search for brand logos

### 📚 Library Documentation
- **[Context7 Library Resolver](https://github.com/upstash/context7)** - Resolve package names to Context7 library IDs
  - **Documentation**: [context7.com](https://context7.com)
  - **Claude Code Setup**: [Local Server Connection Guide](https://github.com/upstash/context7?tab=readme-ov-file#claude-code-local-server-connection)
  - **Usage**: Automatically resolves library names to fetch documentation

- **[Context7 Documentation](https://github.com/upstash/context7)** - Fetch up-to-date library documentation
  - **Features**: Real-time documentation for 1000+ libraries
  - **Usage**: Get current docs for React, Next.js, Prisma, and more

### 🌐 Browser Automation
- **[Puppeteer MCP Server](https://smithery.ai/server/@smithery-ai/puppeteer)** - Full browser automation
  - **Documentation**: [Puppeteer API](https://pptr.dev)
  - **Features**: Navigate, screenshot, click, fill forms, evaluate JavaScript
  - **Usage**: Automated testing, screenshot generation, web scraping

### 🧠 Enhanced Thinking
- **[Sequential Thinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)** - Multi-step problem-solving
  - **Features**: Reflection, revision, hypothesis generation and verification
  - **Usage**: Complex feature planning with iterative refinement

### 🔗 Additional Resources

- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)** - Core protocol documentation
- **[Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)** - Complete guide to Claude Code
- **[FastMCP](https://github.com/jlowin/fastmcp)** - Python MCP server framework (used in our AI server)
- **[MCP Servers Repository](https://github.com/modelcontextprotocol/servers)** - Collection of MCP server implementations
- **[Smithery.ai](https://smithery.ai/)** - MCP server marketplace and discovery
- **[shadcn/ui](https://ui.shadcn.com/)** - UI component library used in web application

### Usage Examples

```bash
# Generate modern UI components
/ui create a responsive data table with filters

# Get up-to-date library documentation  
Ask about "react-hook-form validation patterns"

# Automate browser testing
Take a screenshot of the dashboard at localhost:3000

# Complex problem solving
Plan and implement a new feature with multiple iterations and refinements

# Search for brand assets
/logo Discord Slack GitHub
```

These tools significantly enhance development workflows by providing AI-powered component generation, real-time documentation access, browser automation, and sophisticated problem-solving capabilities.

## 📄 License

MIT License - see LICENSE file for details