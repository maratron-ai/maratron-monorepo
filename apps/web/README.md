# Maratron Web Application

The Next.js frontend for the Maratron AI-powered running and fitness platform. Features comprehensive run tracking, social networking, training plans, and an intelligent AI chat powered by MCP integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Configuration

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://maratron:yourpassword@localhost:5432/maratrondb"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here

# Optional: AI integration
ANTHROPIC_API_KEY=your_anthropic_key_here
```

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credential provider
- **UI**: Tailwind CSS + shadcn/ui components
- **Testing**: Jest with React Testing Library
- **AI Integration**: Model Context Protocol (MCP) client

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components organized by feature
│   ├── ui/                # shadcn/ui components
│   ├── profile/           # User profile components
│   ├── runs/              # Running activity components
│   ├── shoes/             # Shoe tracking components
│   ├── social/            # Social features components
│   ├── training/          # Training plan components
│   └── chat/              # AI chat interface
├── lib/                   # Utilities and business logic
│   ├── api/               # API layer functions
│   ├── utils/             # Utility functions (with comprehensive tests)
│   ├── mcp/               # MCP client integration
│   ├── database/          # Database utilities
│   └── schemas/           # Validation schemas
├── hooks/                 # Custom React hooks
└── maratypes/             # TypeScript type definitions
```

## 🛠️ Development Commands

### Core Commands

```bash
npm run dev              # Development server with Turbopack
npm run build            # Production build
npm start               # Start production server
npm run lint            # ESLint validation
npm run type-check      # TypeScript checking
npm test                # Run Jest test suites (188 tests)
npm run test:watch      # Jest in watch mode
```

### Database Commands

```bash
npx prisma studio               # Open Prisma Studio GUI
npx prisma generate             # Generate Prisma client
npx prisma db push              # Push schema changes
npx prisma db pull              # Pull schema from database
npm run db:seed                 # Load comprehensive test data
npm run db:reset                # Reset database and reload seed data
```

### Code Quality

```bash
npm run format                  # Format code with Prettier
npm run format:check           # Check code formatting
npm run lint:fix               # Fix ESLint issues
```

## 🧪 Testing

### Current Status
✅ **188 tests passing** - Comprehensive coverage across all components

### Test Structure
- **Component Tests**: React Testing Library for UI components
- **API Tests**: Route testing for all API endpoints
- **Utility Tests**: Comprehensive coverage for business logic
- **Integration Tests**: End-to-end MCP integration testing

### Running Tests

```bash
npm test                        # Run all tests
npm run test:watch             # Watch mode for development
npm run test:coverage          # Generate coverage report
npm test -- --testNamePattern="ChatInterface"  # Run specific tests
```

### Test Files Organization
```
src/
├── components/__tests__/       # Component tests
├── lib/api/__tests__/         # API layer tests
├── lib/utils/__tests__/       # Utility function tests
└── hooks/__tests__/           # Custom hook tests
```

## 🔧 Key Features

### Running & Training
- **Run Tracking**: Distance, pace, heart rate, elevation with GPS data
- **Shoe Management**: Mileage tracking with retirement alerts
- **Training Plans**: AI-generated plans based on goals and VDOT calculations
- **VDOT Calculator**: Jack Daniels running performance predictor
- **Pace Analysis**: Comprehensive pace and performance analytics

### Social Features
- **User Profiles**: Customizable running profiles with stats
- **Run Groups**: Create and join running communities
- **Social Feed**: Share runs and interact with other runners
- **Comments & Likes**: Full social engagement system
- **Follow System**: Connect with other runners

### AI Integration
- **Intelligent Chat**: Context-aware running advice with actual user data
- **Hybrid Architecture**: Docker mode (direct DB) + local mode (MCP)
- **Smart Query Routing**: Automatically detects when user data is needed
- **Enhanced Prompts**: LLM receives detailed run/shoe data for personalized responses
- **User Context Management**: Session-based personalization

## 📊 Database Integration

### Schema Overview
The application uses a comprehensive PostgreSQL schema with:

- **Users**: Profile data, training preferences, VDOT calculations
- **Runs**: Comprehensive run tracking with pace, elevation, notes
- **Shoes**: Mileage tracking with retirement management
- **Social**: Posts, comments, likes, follows, groups
- **Training**: Plans and goal management

### Prisma Integration
- Type-safe database queries
- Automatic migration generation
- Built-in connection pooling
- Development-friendly Prisma Studio

### Data Validation
- Yup schemas for form validation
- Server-side input sanitization
- Type-safe API responses
- Comprehensive error handling

## 🤖 MCP Client Integration

### Architecture
The web application integrates with the Maratron AI server through a sophisticated MCP client:

```typescript
// MCP client setup
const mcpClient = getMCPClient();
await mcpClient.connect();

// Set user context for personalized responses
await mcpClient.setUserContext(userId);

// Access AI server resources
const userProfile = await mcpClient.readResource('user://profile');
const recentRuns = await mcpClient.readResource('runs://user/recent');
```

### Hybrid Integration
- **Docker Mode**: Direct Prisma database access (bypasses MCP stdio conflicts)
- **Local Mode**: Traditional MCP client connection for development
- **Environment Detection**: Automatic switching between modes
- **Fallback Handling**: Graceful degradation when MCP is unavailable

### Smart Features
- Intelligent query routing and user data detection
- Enhanced system prompts with detailed user context
- Real-time AI responses with actual run and shoe data
- Session management and user preference caching

## 🎨 UI/UX Guidelines

### Component Library
- **shadcn/ui**: Modern, accessible component library
- **Tailwind CSS**: Utility-first styling approach
- **Lucide React**: Consistent icon system
- **Responsive Design**: Mobile-first approach

### Design Patterns
```tsx
// Standard layout pattern
<div className="container mx-auto px-4 max-w-screen-lg">
  {/* Content */}
</div>

// Form pattern with validation
<FormField
  control={form.control}
  name="distance"
  render={({ field }) => (
    <TextField
      label="Distance"
      {...field}
      error={form.formState.errors.distance?.message}
    />
  )}
/>
```

### Brand Colors
Available CSS variables include:
- `--brand-from`, `--brand-to` (gradient)
- `--brand-orange`, `--brand-blue`, `--brand-purple`
- `--primary`, `--accent`, `--muted` (theme colors)

## 🔐 Security

### Authentication
- NextAuth.js with credential provider
- Secure session management
- Password hashing with bcrypt
- Protected API routes

### Data Protection
- Input validation and sanitization
- CSRF protection
- Rate limiting on sensitive operations
- Environment-based configuration

### Best Practices
- No secrets in client-side code
- Secure environment variable handling
- Type-safe API endpoints
- Comprehensive error boundaries

## 📈 Performance

### Optimization Features
- **Turbopack**: Fast development builds
- **Next.js 15**: Latest performance optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js built-in image optimization
- **Database Optimization**: Efficient Prisma queries with indexes

### Monitoring
- Error boundary components
- Performance monitoring hooks
- Database query optimization
- Bundle analysis tools

## 🚀 Deployment

### Build Process
```bash
npm run build              # Production build
npm run start             # Start production server
npm run preview           # Preview production build locally
```

### Environment Setup
- **Development**: `.env.development`
- **Testing**: `.env.test`
- **Production**: Environment variables via deployment platform

### Docker Support
- Multi-stage Dockerfile for optimal production builds
- Docker Compose for complete development environment
- Environment-aware configuration

## 📚 Resources

- **[Next.js Documentation](https://nextjs.org/docs)** - Framework documentation
- **[Prisma Documentation](https://www.prisma.io/docs)** - Database ORM
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling framework
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - AI integration

## 📄 License

MIT License - see LICENSE file for details