# Web Application Documentation

The Maratron web application is a Next.js 15 application with TypeScript that provides a comprehensive running and fitness platform with social features and AI-powered insights.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS + shadcn/ui components
- **Testing**: Jest with React Testing Library
- **AI Integration**: Model Context Protocol (MCP) client

### Directory Structure
```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── (auth)/            # Authentication pages
│   │   ├── social/            # Social features
│   │   └── runs/              # Run tracking
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── social/           # Social feature components
│   │   ├── runs/             # Run tracking components
│   │   └── chat/             # AI chat components
│   ├── lib/                  # Utilities and business logic
│   │   ├── api/              # API layer functions
│   │   ├── utils/            # Utility functions
│   │   ├── mcp/              # MCP client integration
│   │   └── schemas/          # Validation schemas
│   ├── hooks/                # Custom React hooks
│   └── maratypes/            # TypeScript type definitions
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── tests/                    # Test configuration
```

## 📊 Features

### 🏃‍♂️ Run Tracking
- **Run Recording**: Distance, duration, pace, elevation tracking
- **Analytics**: VDOT calculations, race pace predictions
- **History**: Comprehensive run history with filtering
- **Statistics**: Weekly/monthly summaries and trends

### 👥 Social Features
- **User Profiles**: Customizable running profiles with goals
- **Social Feed**: Share runs and interact with other runners
- **Groups**: Create and join running communities
- **Engagement**: Comments, likes, and social interactions

### 👟 Equipment Management
- **Shoe Tracking**: Monitor mileage and retirement status
- **Equipment History**: Track usage patterns
- **Retirement Alerts**: Notifications for high-mileage shoes

### 🤖 AI Integration
- **Intelligent Chat**: Context-aware running advice via MCP
- **Personalized Responses**: Based on user history and preferences
- **Training Insights**: AI-powered training recommendations

### 📈 Training Plans
- **Plan Generation**: AI-generated training plans
- **Goal-Based**: Plans tailored to race goals and fitness level
- **Progress Tracking**: Monitor plan adherence and progress

## 🔧 Development

### Setup
```bash
cd apps/web
npm install
npx prisma generate
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/maratrondb"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# AI Integration (optional)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

### Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open database GUI
npx prisma studio
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Building
```bash
# Development build
npm run build

# Production build
NODE_ENV=production npm run build
```

## 🗄️ Database Schema

### Core Entities

#### Users
```typescript
interface User {
  id: string;              // UUID primary key
  email: string;           // Unique email
  name: string;            // Display name
  createdAt: Date;
  avatarUrl?: string;      // Profile picture
  // Training preferences
  preferredDistanceUnit: 'miles' | 'kilometers';
  weeklyMileageGoal?: number;
  vdot?: number;          // Jack Daniels VDOT score
}
```

#### Runs
```typescript
interface Run {
  id: string;              // UUID primary key
  userId: string;          // Foreign key to User
  date: Date;              // Run date
  distance: number;        // Distance in user's preferred unit
  duration: number;        // Duration in minutes
  pace?: string;          // Calculated pace
  elevationGain?: number; // Elevation in feet/meters
  notes?: string;         // User notes
  createdAt: Date;
}
```

#### Social Features
```typescript
interface SocialProfile {
  id: string;
  userId: string;
  username: string;        // Unique username
  bio?: string;
  isPublic: boolean;
}

interface RunPost {
  id: string;
  authorId: string;
  runId?: string;         // Optional linked run
  content: string;
  imageUrl?: string;
  createdAt: Date;
}
```

## 🔌 API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Runs
- `GET /api/runs` - List user's runs
- `POST /api/runs` - Create new run
- `GET /api/runs/[id]` - Get specific run
- `PUT /api/runs/[id]` - Update run
- `DELETE /api/runs/[id]` - Delete run

### Social
- `GET /api/social/feed` - Get social feed
- `POST /api/social/posts` - Create post
- `POST /api/social/follow` - Follow user
- `GET /api/social/profile/[username]` - Get profile

### AI Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat` - Get available tools

## 🎨 UI Components

### Design System
The app uses shadcn/ui components with a custom theme:

#### Colors
- **Primary**: Brand blue for key actions
- **Secondary**: Brand orange for highlights
- **Accent**: Brand purple for special features
- **Muted**: Grays for secondary content

#### Typography
- **Font**: Inter for clean, readable text
- **Scale**: Tailwind typography scale
- **Hierarchy**: Clear heading and body text distinction

### Component Organization
```
components/
├── ui/                  # Base shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── dialog.tsx
├── runs/               # Run-specific components
│   ├── RunsList.tsx
│   ├── RunForm.tsx
│   └── DashboardStats.tsx
├── social/             # Social feature components
│   ├── SocialFeed.tsx
│   ├── PostList.tsx
│   └── ProfileSearch.tsx
└── chat/               # AI chat components
    ├── ChatInterface.tsx
    ├── ChatMessage.tsx
    └── ChatInput.tsx
```

## 🧪 Testing Strategy

### Unit Tests
- **Utilities**: All utility functions have comprehensive tests
- **Components**: Key components have behavioral tests
- **API Functions**: API layer functions are tested with mocks

### Integration Tests
- **API Routes**: Test complete request/response cycles
- **Database**: Test Prisma operations with test database
- **Authentication**: Test auth flows and session management

### Test Files Location
```
src/
├── lib/utils/__tests__/     # Utility function tests
├── components/__tests__/    # Component tests
├── lib/api/__tests__/       # API layer tests
└── hooks/__tests__/         # Custom hook tests
```

### Running Tests
```bash
# All tests
npm test

# Specific test file
npm test -- RunsList.test.tsx

# Watch mode for development
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## 🔒 Security

### Authentication
- NextAuth.js with secure session management
- Credential-based authentication with email/password
- Session cookies with secure flags
- CSRF protection built-in

### Data Protection
- Input validation with Yup schemas
- SQL injection prevention via Prisma
- XSS protection through React's built-in escaping
- Rate limiting on sensitive endpoints

### Privacy
- User data isolation
- Public/private profile options
- Selective data sharing for social features

## 🚀 Performance

### Optimization Strategies
- **Static Generation**: Pre-built pages where possible
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting by route
- **Caching**: Aggressive caching of static assets

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run analyze
```

### Performance Monitoring
- Core Web Vitals tracking
- Runtime performance monitoring
- Database query optimization with Prisma

## 🔧 Configuration

### Next.js Configuration
```javascript
// next.config.ts
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};
```

### TypeScript Configuration
- Strict mode enabled
- Path aliases for clean imports
- Comprehensive type coverage
- Next.js specific types included

## 📱 Mobile Support

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Touch-friendly interface elements
- Progressive Web App capabilities
- Offline-first data handling

### Platform Features
- GPS integration for run tracking
- Camera access for photo uploads
- Push notifications for social interactions
- Background sync for data synchronization

## 🔍 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Clear node modules
rm -rf node_modules && npm install
```

#### Database Issues
```bash
# Reset database
npx prisma db push --force-reset

# Check database connection
npx prisma db ping
```

#### TypeScript Errors
```bash
# Check types
npx tsc --noEmit

# Restart TypeScript server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

### Development Tips
- Use React DevTools for component debugging
- Leverage Prisma Studio for database inspection
- Use Next.js DevTools for performance analysis
- Enable verbose logging for API debugging