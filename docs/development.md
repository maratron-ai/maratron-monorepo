# Development Guide

This guide covers development setup, tools, and best practices for contributing to the Maratron project.

## 🚀 Quick Setup

```bash
# Clone and setup
git clone https://github.com/maratron-ai/maratron-monorepo.git
cd maratron-monorepo

# Install dependencies
npm install
cd apps/web && npm install

# Setup database
npm run db:push
npm run db:seed

# Start development
npm run dev
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

**Seeding:**
```bash
# Seed development data
npm run db:seed

# Reset database and re-seed
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

**Development Data:**
The seed script creates:
- 4 users with different training levels
- Multiple running shoes for each user
- Recent runs with realistic data
- Social profiles with follows/posts/comments
- A sample run group
- A marathon training plan

**Test Users:**
- `john@example.com` - Intermediate marathoner
- `sarah@example.com` - Advanced 5K specialist  
- `mike@example.com` - Advanced Boston qualifier
- `emily@example.com` - Beginner training for first marathon

## 🧪 Testing

### Web Application
```bash
# Run all tests
npm test

# Run tests in watch mode  
npm test -- --watch

# Run specific test file
npm test -- ChatInput

# Run with coverage
npm test -- --coverage
```

### AI Server
```bash
# Unit tests
npm run test:ai -- tests/unit/

# Integration tests (requires test DB)
npm run test:ai -- tests/integration/

# All tests with coverage
cd apps/ai && uv run pytest --cov=src --cov-report=html
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

## 🎯 Development Best Practices

### Code Style
- **TypeScript**: Strict mode enabled, comprehensive typing
- **React**: Functional components with hooks
- **CSS**: Tailwind utility classes, component-scoped styles
- **Python**: Type hints, async/await patterns

### Git Workflow
1. Create feature branch from `develop`
2. Make changes with descriptive commits
3. Pre-commit hooks run automatically
4. Push branch and create pull request
5. CI runs tests and builds
6. Code review and merge

### Component Development
- Use shadcn/ui for UI components
- Follow existing component patterns
- Include TypeScript props interfaces
- Add tests for complex components
- Use Tailwind for styling

### API Development
- RESTful endpoints in `app/api/`
- Consistent error handling
- Input validation with Yup/Zod
- Prisma for database operations
- NextAuth.js for authentication

### Database Changes
1. Update Prisma schema
2. Generate migration: `npx prisma migrate dev`
3. Update seed script if needed
4. Test with fresh database

## 🔍 Debugging

### Web Application
- React DevTools browser extension
- Next.js DevTools for performance
- Prisma Studio for database inspection
- Browser developer tools

### AI Server
- MCP Inspector UI for tool debugging
- Python debugger (pdb) for step-through
- Comprehensive logging with structured output
- Health check script for system validation

### Common Issues
- **Module resolution**: Check path aliases in `tsconfig.json`
- **Database connection**: Verify `DATABASE_URL` environment variable
- **Type errors**: Run `npx tsc --noEmit` for full type checking
- **Build failures**: Clear `.next` and `node_modules`, reinstall

## 📚 Resources

### Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Model Context Protocol](https://modelcontextprotocol.io)

### Development Tools
- [Prisma Studio](http://localhost:5555) - Database GUI
- [MCP Inspector](http://localhost:3001) - AI server debugging
- [React DevTools](https://react.dev/learn/react-developer-tools)

## 🤝 Contributing

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Format** code with pre-commit hooks
7. **Push** and create a pull request
8. **Respond** to code review feedback

### Pull Request Guidelines
- Clear title and description
- Reference related issues
- Include tests for new features
- Update documentation as needed
- Ensure CI passes

For questions or support, open an issue on GitHub or check the documentation!