# 🏗️ Maratron Architecture Documentation

## Overview

Maratron is a modern, cloud-native running and fitness platform built with containerized microservices architecture. This document provides comprehensive technical details about the system design, component interactions, and infrastructure patterns.

## 🎯 Architecture Principles

### Design Philosophy
- **Cloud-Native First** - Designed for container orchestration and cloud deployment
- **Development-Production Parity** - Identical environments across all stages
- **Microservices Pattern** - Loosely coupled services with clear responsibilities
- **Performance by Design** - Caching, optimization, and monitoring built-in
- **Security by Default** - Authentication, authorization, and data protection
- **Developer Experience** - Multiple development modes for different workflows

### Technical Standards
- **Containerization** - Docker for all services with health checks
- **Type Safety** - TypeScript throughout with strict mode
- **Test-Driven** - Comprehensive test coverage
- **Performance Monitoring** - Built-in metrics and observability
- **Documentation First** - Self-documenting code and comprehensive docs

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Maratron Platform                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     Presentation Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Frontend  │  │   Mobile App    │  │   Admin Panel   │ │
│  │   (Next.js 15)  │  │  (Future v2.0)  │  │  (Future v1.5)  │ │
│  │   React + TS    │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                   Application Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Server    │  │   AI Server     │  │  Worker Queue   │ │
│  │   (Next.js)     │  │   (FastMCP)     │  │  (Future v1.2)  │ │
│  │   API Routes    │  │   Claude 3.5    │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Cache Store   │  │  Primary DB     │  │   File Storage  │ │
│  │   (Redis 7)     │  │ (PostgreSQL 15) │  │  (Future v1.3)  │ │
│  │   Hot Data      │  │   ACID Store    │  │   Images/Files  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Environment                           │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │  Web Container  │    │  DB Container   │    │ Cache Container │
│  │                 │    │                 │    │                 │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│  │ │ Next.js App │ │◄──►│ │ PostgreSQL  │ │    │ │   Redis     │ │
│  │ │ Port: 3000  │ │    │ │ Port: 5432  │ │    │ │ Port: 6379  │ │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│  │ │ AI Server   │ │    │ │ Health      │ │    │ │ Persistence │ │
│  │ │ Port: 3001  │ │    │ │ Checks      │ │    │ │ AOF + RDB   │ │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│           │                       │                       │      │
│           └───────────────────────┼───────────────────────┘      │
│                                  │                              │
│                    ┌─────────────────┐                          │
│                    │ Docker Network  │                          │
│                    │ (Bridge Mode)   │                          │
│                    │ Service Mesh    │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction

1. **Web Application** serves the user interface and handles authentication
2. **AI Server** provides intelligent database operations and user context management
3. **Shared Database** stores all application data with consistent schema
4. **MCP Communication** enables real-time bidirectional communication

## 🔧 Technology Stack

### Frontend (Web App)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: Tailwind CSS + shadcn/ui components
- **Authentication**: NextAuth.js
- **Database ORM**: Prisma
- **Testing**: Jest + React Testing Library

### Backend (AI Server)
- **Framework**: FastMCP (Model Context Protocol)
- **Language**: Python 3.11+
- **Database**: Direct PostgreSQL with asyncpg
- **Configuration**: Pydantic with environment validation
- **Testing**: pytest with async support
- **Package Manager**: uv

### Database
- **Engine**: PostgreSQL 15+
- **Schema Management**: Prisma migrations
- **Connection**: Connection pooling for both applications
- **Naming**: PascalCase tables with UUID primary keys

## 📊 Data Flow

### User Interaction Flow
```
User Request → Web App → MCP Client → AI Server → Database → Response
     ↑                                                           │
     └───────────────── UI Update ←─────────────────────────────┘
```

### AI-Enhanced Operations
1. User performs action in web app
2. Web app calls MCP client with user context
3. AI server processes request with user-aware intelligence
4. Database operations are performed with context
5. Intelligent response returned to user

## 🔐 Security Architecture

### Authentication & Authorization
- **Web App**: NextAuth.js session management
- **AI Server**: UUID-based user validation
- **Database**: Row-level security with user isolation

### Data Protection
- **Input Validation**: Comprehensive validation at all layers
- **SQL Injection**: Prevented via ORM and parameterized queries
- **Rate Limiting**: AI server implements per-user rate limits
- **Session Management**: Secure session handling with timeouts

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Web App       │   │   AI Server     │   │   PostgreSQL    │
│   localhost:3000│   │   localhost:3001│   │   localhost:5432│
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### Docker Compose Setup
- All services containerized for consistent development
- Shared PostgreSQL database container
- Volume mounts for live code editing
- Automatic database schema application

### Production Considerations
- **Scalability**: Both applications designed for horizontal scaling
- **Database**: Connection pooling and query optimization
- **Monitoring**: Health checks and performance metrics
- **Security**: Environment-specific configuration validation

## 📡 Communication Patterns

### Model Context Protocol (MCP)
- **Purpose**: Enables AI server to provide context-aware database tools
- **Benefits**: Real-time communication, stateful sessions, tool discovery
- **Implementation**: FastMCP server with asyncio support

### MCP Tool Categories
1. **User Context Management**: Session handling and preferences
2. **Database Operations**: CRUD operations with intelligence
3. **Analytics**: Performance calculations and insights
4. **Health Monitoring**: System status and diagnostics

## 🗄️ Database Schema Design

### Core Entities
- **Users**: Profile data with training preferences
- **Runs**: Distance, duration, pace tracking
- **Shoes**: Equipment tracking with mileage
- **Social**: Profiles, posts, follows, groups

### Relationship Patterns
- All entities use UUID primary keys
- Foreign key relationships maintain referential integrity
- Timestamps for audit trails
- JSON fields for flexible data storage

### Schema Evolution
- Prisma migrations for schema changes
- Backward compatibility maintained
- Database versioning through migration files

## 🔄 Development Workflow

### Local Development
1. Start PostgreSQL database
2. Run AI server (`python run_server.py`)
3. Run web application (`npm run dev`)
4. Both applications connect to shared database

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-component testing
- **End-to-End**: Full user journey testing
- **Database Tests**: Schema and query validation

### CI/CD Considerations
- **Build Process**: Separate builds for each application
- **Testing**: Parallel test execution
- **Database**: Test database management
- **Deployment**: Environment-specific configurations

## 📊 Performance Characteristics

### Scalability Patterns
- **Web App**: Stateless design for horizontal scaling
- **AI Server**: Session-based with cleanup mechanisms
- **Database**: Optimized queries with proper indexing

### Caching Strategy
- **Web App**: Next.js static generation and caching
- **AI Server**: User context caching with TTL
- **Database**: Query result caching where appropriate

### Monitoring & Observability
- **Health Checks**: Automated system health validation
- **Performance Metrics**: Query timing and resource usage
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage patterns and performance

## 🔮 Future Considerations

### Extensibility
- **Plugin Architecture**: MCP tools are easily extensible
- **API Evolution**: RESTful APIs with versioning support
- **Feature Flags**: Environment-based feature toggles

### Technology Evolution
- **Framework Updates**: Next.js and FastMCP version management
- **Database Migration**: PostgreSQL version upgrades
- **Performance Optimization**: Continuous performance improvements

This architecture provides a solid foundation for a scalable, maintainable running and fitness application with AI-powered features.