# 🐳 Maratron Docker Development Environment

## Overview

This setup provides a complete containerized development environment following industry best practices:

- **PostgreSQL 15** - Primary database with persistent storage
- **Redis 7** - Caching layer with persistence  
- **Next.js Web App** - Main application with live reloading
- **Python AI Server** - MCP server for AI functionality

## Quick Start

```bash
# Start the entire development stack
npm run dev

# Stop and clean up
npm run clean
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Maratron App  │    │   PostgreSQL    │    │      Redis      │
│   (Next.js +    │───▶│   Database      │    │     Cache       │
│   Python AI)    │    │   Port: 5432    │    │   Port: 6379    │
│   Port: 3000    │    └─────────────────┘    └─────────────────┘
└─────────────────┘             │                       │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │  maratron_network│
                    │   (Docker Bridge)│
                    └─────────────────┘
```

## Services

### 🐘 PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432 (exposed to host)
- **Database**: maratrondb
- **User**: maratron / yourpassword
- **Persistence**: `postgres_data` volume
- **Health Check**: pg_isready every 10s

### 🚀 Redis Cache
- **Image**: redis:7-alpine  
- **Port**: 6379 (exposed to host)
- **Persistence**: `redis_data` volume with AOF
- **Memory Limit**: 256MB with LRU eviction
- **Health Check**: Redis PING every 30s

### 🌐 Maratron Application
- **Build**: Custom Ubuntu 22.04 with Node.js 20 + Python 3.11
- **Ports**: 3000 (web), 3001 (AI server)
- **Live Reload**: Source code mounted for development
- **Dependencies**: Waits for PostgreSQL and Redis to be healthy

## Environment Variables

The stack uses these containerized service connections:

```bash
# Database (automatically configured)
DATABASE_URL=postgresql://maratron:yourpassword@postgres:5432/maratrondb

# Redis (automatically configured)  
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_ENABLED=true
REDIS_KEY_PREFIX=maratron:dev:

# Your custom environment variables from .env
NEXTAUTH_SECRET=your_secret
ANTHROPIC_API_KEY=your_key
WEATHER__API_KEY=your_key
```

## Volume Mounts

### Persistent Data
- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis persistence files

### Development Volumes
- `./apps/web` → `/app/web` - Live web app code editing
- `./apps/ai` → `/app/ai` - Live AI server code editing  
- `web_node_modules` - Preserved Node.js packages
- `ai_venv` - Preserved Python virtual environment

## Startup Sequence

1. **PostgreSQL** starts first with health checks
2. **Redis** starts in parallel with health checks
3. **Application** waits for both services to be healthy
4. **Database Schema** applied via Prisma
5. **Database Seeding** (if available)
6. **Web App** and **AI Server** start in parallel

## Development Commands

```bash
# Full development stack
npm run dev                 # Start all services in Docker

# Individual services (alternative)
npm run dev:local          # Redis in Docker + Web app locally  
npm run dev:web            # Web app only (local)
npm run dev:ai             # AI server only (local)

# Database operations
npm run db:studio          # Open Prisma Studio
npm run db:push            # Push schema changes
npm run db:seed            # Seed with test data

# Maintenance
npm run clean              # Stop and remove all containers/volumes
npm run logs               # View container logs
```

## Health Monitoring

### Service Health
```bash
# Check all services
docker-compose ps

# Check specific service health
docker-compose exec postgres pg_isready -U maratron
docker-compose exec redis redis-cli ping
```

### Application Health
```bash
# Web app
curl http://localhost:3000/api/health

# Database connection from app
curl http://localhost:3000/api/performance

# Redis connection from app  
curl http://localhost:3000/api/performance?action=cache
```

## Production Parity

This development environment closely mirrors production:

✅ **Containerized Services** - Same as production deployment  
✅ **Service Discovery** - DNS-based container communication  
✅ **Health Checks** - Proper dependency management  
✅ **Persistent Storage** - Data survives container restarts  
✅ **Network Isolation** - Services communicate via private network  
✅ **Environment Configuration** - Container-native environment variables  

## Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check service status
docker-compose ps

# View logs for specific service
docker-compose logs postgres
docker-compose logs redis
docker-compose logs maratron
```

**Database connection issues:**
```bash
# Test PostgreSQL connection
docker-compose exec postgres psql -U maratron -d maratrondb -c "SELECT 1;"

# Check database logs
docker-compose logs postgres
```

**Redis connection issues:**
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis info
docker-compose exec redis redis-cli info
```

**Port conflicts:**
```bash
# Stop conflicting services
sudo lsof -ti:5432 | xargs kill -9  # PostgreSQL
sudo lsof -ti:6379 | xargs kill -9  # Redis
sudo lsof -ti:3000 | xargs kill -9  # Web app
```

### Clean Reset
```bash
# Complete environment reset
npm run clean
docker system prune -f
docker volume prune -f
npm run dev
```

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Service-specific metrics
curl http://localhost:3000/api/performance
```

## Benefits of This Setup

🚀 **Fast Development** - Live reload with persistent data  
🔒 **Isolated Environment** - No conflicts with host services  
📦 **Easy Sharing** - Consistent across all developer machines  
🎯 **Production Parity** - Same container stack as production  
🛠️ **Full Stack Testing** - Test complete application interactions  
⚡ **Performance Testing** - Redis caching in realistic environment  

## Next Steps

1. Run `npm run dev` to start development
2. Visit http://localhost:3000 to see your application
3. Make code changes and see live reloads
4. Use Prisma Studio at http://localhost:5555 for database management
5. Monitor performance at http://localhost:3000/api/performance