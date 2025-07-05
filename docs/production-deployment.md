# 🚀 Production Deployment Guide

This comprehensive guide covers deploying Maratron to production environments with enterprise-grade security, scalability, and reliability.

## 🎯 Overview

Maratron is designed for production deployment with:

- **Containerized Architecture** - Docker-based deployment for consistency
- **Horizontal Scaling** - Multi-instance web and AI server support
- **Database High Availability** - PostgreSQL with replication and backup
- **Redis Clustering** - High-performance caching with failover
- **Security Hardening** - HTTPS, authentication, rate limiting, input validation
- **Monitoring & Alerting** - Comprehensive observability stack

## 🏗️ Production Architecture

### Recommended Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (HTTPS)                   │
│                  (nginx/Cloudflare/AWS ELB)                │
└─────────────────────────┬───────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐        ┌─────▼─────┐        ┌─────▼─────┐
│Web App │        │ Web App   │        │ Web App   │
│Instance│        │ Instance  │        │ Instance  │
│   #1   │        │    #2     │        │    #3     │
└────────┘        └───────────┘        └───────────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐        ┌─────▼─────┐        ┌─────▼─────┐
│   AI   │        │    AI     │        │    AI     │
│Server  │        │  Server   │        │  Server   │
│   #1   │        │    #2     │        │    #3     │
└────────┘        └───────────┘        └───────────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────┐
│              Database Cluster                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ PostgreSQL  │ │ PostgreSQL  │ │ PostgreSQL  │   │
│  │   Primary   │ │  Replica 1  │ │  Replica 2  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────┐
│                Redis Cluster                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Redis     │ │   Redis     │ │   Redis     │   │
│  │   Master    │ │  Replica 1  │ │  Replica 2  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 🔧 Environment Configuration

### Production Environment Variables

**Core Application Settings**:
```env
# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database (Managed Service)
DATABASE_URL="postgresql://username:password@prod-db.cloud:5432/maratrondb?sslmode=require"
DATABASE_POOL_SIZE=20
DATABASE_MAX_CONNECTIONS=100

# Redis (Managed Service)
REDIS_URL="redis://prod-redis.cloud:6379"
REDIS_CLUSTER_ENABLED=true
REDIS_KEY_PREFIX=maratron:prod:
REDIS_ENABLED=true

# Security
NEXTAUTH_SECRET="production-secret-key-64-characters-minimum-entropy"
NEXTAUTH_URL=https://your-domain.com
BCRYPT_ROUNDS=12

# AI Integration
ANTHROPIC_API_KEY="your-production-anthropic-key"
WEATHER_API_KEY="your-weather-api-key"

# Monitoring & Logging
SENTRY_DSN="https://your-sentry-dsn"
LOG_LEVEL=info
METRICS_ENABLED=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_AI_REQUESTS_PER_MINUTE=10

# Performance
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=900
COMPRESSION_ENABLED=true

# Security Headers
CORS_ORIGINS="https://your-domain.com,https://admin.your-domain.com"
CSRF_PROTECTION=true
```

**Docker Production Configuration**:
```env
# Container Settings
DOCKER_ENV=production
CONTAINER_MEMORY_LIMIT=1g
CONTAINER_CPU_LIMIT=1.0

# Health Checks
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3

# Logging
LOG_DRIVER=json-file
LOG_MAX_SIZE=100m
LOG_MAX_FILES=5
```

## 🛡️ Security Hardening Checklist

### Application Security

- [ ] **HTTPS Enforcement** - Force HTTPS redirects
- [ ] **Security Headers** - HSTS, CSP, X-Frame-Options
- [ ] **Input Validation** - Comprehensive Yup schema validation
- [ ] **Rate Limiting** - API and authentication rate limits
- [ ] **CORS Configuration** - Restrictive origin policies
- [ ] **SQL Injection Prevention** - Parameterized queries with Prisma
- [ ] **XSS Protection** - Content sanitization and CSP
- [ ] **CSRF Protection** - Token-based protection
- [ ] **Session Security** - Secure cookies, timeouts
- [ ] **Secrets Management** - Environment variables, no hardcoded secrets

### Infrastructure Security

- [ ] **Network Isolation** - VPC with private subnets
- [ ] **Database Security** - SSL connections, restricted access
- [ ] **Redis Security** - AUTH enabled, network isolation
- [ ] **Container Security** - Non-root users, minimal base images
- [ ] **Load Balancer Security** - SSL termination, DDoS protection
- [ ] **Firewall Rules** - Minimal required ports open
- [ ] **Access Control** - IAM roles, principle of least privilege
- [ ] **Backup Encryption** - Encrypted at rest and in transit
- [ ] **Log Security** - Centralized logging, no sensitive data

### Security Headers Configuration

```typescript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
];
```

## 📊 Database Migration Strategies

### Pre-Deployment Database Setup

**1. Database Preparation**:
```bash
# Create production database
createdb -h prod-db.cloud -U admin maratrondb

# Enable required extensions
psql -h prod-db.cloud -U admin -d maratrondb -c "
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
  CREATE EXTENSION IF NOT EXISTS \"pg_stat_statements\";
  CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
"

# Set up connection pooling (if using PgBouncer)
# Configure max_connections, shared_buffers, effective_cache_size
```

**2. Migration Strategy**:
```bash
# Run migrations in production
npx prisma migrate deploy

# Generate Prisma client for production
npx prisma generate

# Verify schema integrity
npx prisma validate

# Create database indexes for performance
npx prisma db execute --file ./prisma/production-indexes.sql
```

**3. Production Indexes**:
```sql
-- Critical indexes for production performance
-- File: prisma/production-indexes.sql

-- User queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON "Users"("email") WHERE "deletedAt" IS NULL;

-- Run tracking optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_runs_user_date 
ON "Runs"("userId", "date" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_runs_performance 
ON "Runs"("userId", "distance", "duration") WHERE "date" > NOW() - INTERVAL '1 year';

-- Social features optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_social_created 
ON "Posts"("socialProfileId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower 
ON "Follows"("followerId", "createdAt" DESC);

-- Shoe tracking optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shoes_user_active 
ON "Shoes"("userId") WHERE "retired" = false;

-- Training plans optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_plans_user_active 
ON "TrainingPlans"("userId") WHERE "active" = true;

-- Performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_level_timestamp 
ON "SystemLogs"("level", "timestamp" DESC) WHERE "timestamp" > NOW() - INTERVAL '30 days';
```

### Database Backup Strategy

**Automated Backups**:
```bash
#!/bin/bash
# backup-script.sh - Run via cron every 6 hours

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
BACKUP_FILE="$BACKUP_DIR/maratron_backup_$TIMESTAMP.sql.gz"

# Create backup with compression
pg_dump -h prod-db.cloud -U admin -d maratrondb | gzip > $BACKUP_FILE

# Upload to cloud storage (S3/GCS)
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/postgresql/

# Verify backup integrity
gunzip -t $BACKUP_FILE

# Clean up local backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Log backup completion
echo "$(date): Backup completed successfully: $BACKUP_FILE" >> /var/log/backup.log
```

**Point-in-Time Recovery Setup**:
```bash
# Enable WAL archiving for point-in-time recovery
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://your-backup-bucket/wal/%f'
max_wal_senders = 3
checkpoint_completion_target = 0.9
```

## 🔄 Redis Scaling & Persistence

### Redis Production Configuration

**Redis Cluster Setup**:
```yaml
# docker-compose.prod.yml for Redis cluster
version: '3.8'
services:
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes --cluster-enabled yes
    volumes:
      - redis-master-data:/data
    ports:
      - "6379:6379"
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  redis-replica-1:
    image: redis:7-alpine
    command: redis-server --appendonly yes --slaveof redis-master 6379
    volumes:
      - redis-replica-1-data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - redis-master

  redis-replica-2:
    image: redis:7-alpine
    command: redis-server --appendonly yes --slaveof redis-master 6379
    volumes:
      - redis-replica-2-data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - redis-master

volumes:
  redis-master-data:
  redis-replica-1-data:
  redis-replica-2-data:
```

**Redis Performance Tuning**:
```conf
# redis.conf production optimizations
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
tcp-keepalive 300
timeout 0
databases 1
```

### Cache Invalidation Strategy

**Production Cache Management**:
```typescript
// Cache invalidation for production
export class ProductionCacheManager {
  private redis: Redis;
  private cluster: Cluster;

  constructor() {
    if (process.env.REDIS_CLUSTER_ENABLED === 'true') {
      this.cluster = new Redis.Cluster([
        { host: 'redis-master', port: 6379 },
        { host: 'redis-replica-1', port: 6379 },
        { host: 'redis-replica-2', port: 6379 }
      ]);
    } else {
      this.redis = new Redis(process.env.REDIS_URL);
    }
  }

  async invalidateUserData(userId: string): Promise<void> {
    const pattern = `${process.env.REDIS_KEY_PREFIX}user:${userId}:*`;
    const keys = await this.scanKeys(pattern);
    
    if (keys.length > 0) {
      await this.deleteKeys(keys);
      console.log(`Invalidated ${keys.length} cache keys for user ${userId}`);
    }
  }

  async warmCache(strategies: string[], userIds: string[]): Promise<void> {
    const tasks = [];
    
    for (const strategy of strategies) {
      for (const userId of userIds) {
        switch (strategy) {
          case 'USER_PROFILE':
            tasks.push(this.preloadUserProfile(userId));
            break;
          case 'USER_RUNS':
            tasks.push(this.preloadUserRuns(userId));
            break;
          case 'LEADERBOARD':
            tasks.push(this.preloadLeaderboards());
            break;
        }
      }
    }
    
    await Promise.allSettled(tasks);
  }
}
```

## 🐳 Container Deployment

### Production Dockerfile

```dockerfile
# Multi-stage production build
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Build application
WORKDIR /app/apps/web
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
      - redis-master
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1g
          cpus: '1.0'
        reservations:
          memory: 512m
          cpus: '0.5'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  ai-server:
    build:
      context: ./apps/ai
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
      - redis-master
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512m
          cpus: '0.5'

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: maratrondb
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    command: >
      postgres
      -c shared_buffers=256MB
      -c max_connections=100
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
    deploy:
      resources:
        limits:
          memory: 2g
          cpus: '1.0'

volumes:
  postgres-data:
    driver: local
```

## 📈 Monitoring & Alerting Setup

### Application Monitoring

**Sentry Integration**:
```typescript
// sentry.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  integrations: [
    new Sentry.Integrations.Prisma({ client: prisma }),
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  beforeSend(event) {
    // Remove sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

**Prometheus Metrics**:
```typescript
// metrics.ts - Custom metrics collection
import client from 'prom-client';

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const cacheHitRate = new client.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['strategy'],
});

export const activeConnections = new client.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
});

// Collect default metrics
client.collectDefaultMetrics();
```

### Log Aggregation

**Structured Logging**:
```typescript
// logger.ts - Production logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'maratron-web',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  transports: [
    new winston.transports.File({
      filename: '/var/log/app/error.log',
      level: 'error',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: '/var/log/app/combined.log',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

**ELK Stack Configuration**:
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - /var/log/app:/var/log/app:ro
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  elasticsearch-data:
  grafana-data:
```

## 🚨 CI/CD Pipeline Recommendations

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Production Deployment

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type checking
        run: npx tsc --noEmit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.CONTAINER_REGISTRY }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: |
            ${{ secrets.CONTAINER_REGISTRY }}/maratron:latest
            ${{ secrets.CONTAINER_REGISTRY }}/maratron:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/maratron
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d --no-deps web
            docker system prune -f
      
      - name: Run database migrations
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/maratron
            docker-compose -f docker-compose.prod.yml exec -T web npx prisma migrate deploy
      
      - name: Health check
        run: |
          sleep 30
          curl -f ${{ secrets.PROD_URL }}/api/health || exit 1
```

### Deployment Verification

**Post-Deployment Checks**:
```bash
#!/bin/bash
# post-deploy-verification.sh

set -e

PROD_URL="https://your-domain.com"
HEALTH_ENDPOINT="$PROD_URL/api/health"
PERFORMANCE_ENDPOINT="$PROD_URL/api/performance"

echo "🔍 Starting post-deployment verification..."

# Health check
echo "✅ Checking application health..."
if curl -f -s "$HEALTH_ENDPOINT" | jq -e '.status == "healthy"' > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Performance check
echo "✅ Checking performance metrics..."
CACHE_HIT_RATE=$(curl -s "$PERFORMANCE_ENDPOINT" | jq -r '.cache.stats.hitRate // 0')
if (( $(echo "$CACHE_HIT_RATE > 80" | bc -l) )); then
    echo "✅ Cache performance acceptable ($CACHE_HIT_RATE%)"
else
    echo "⚠️ Cache performance low ($CACHE_HIT_RATE%)"
fi

# Database check
echo "✅ Checking database connectivity..."
DB_HEALTHY=$(curl -s "$PERFORMANCE_ENDPOINT" | jq -r '.database.healthy')
if [ "$DB_HEALTHY" = "true" ]; then
    echo "✅ Database connectivity verified"
else
    echo "❌ Database connectivity issues"
    exit 1
fi

# AI service check
echo "✅ Checking AI service..."
AI_RESPONSE=$(curl -s -X POST "$PROD_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"messages":[{"role":"user","content":"test"}]}')

if echo "$AI_RESPONSE" | jq -e '.content' > /dev/null; then
    echo "✅ AI service operational"
else
    echo "❌ AI service issues"
    exit 1
fi

echo "🎉 All post-deployment checks passed!"
```

## 📋 Production Readiness Checklist

### Pre-Deployment Validation

**Security & Configuration**:
- [ ] All environment variables configured
- [ ] HTTPS certificates installed and valid
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS policies restrictive
- [ ] Database SSL connections enabled
- [ ] Redis AUTH enabled
- [ ] Secrets rotation plan in place

**Performance & Scalability**:
- [ ] Load testing completed
- [ ] Database indexes optimized
- [ ] Cache strategies validated
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Gzip compression enabled
- [ ] Memory limits configured
- [ ] CPU limits appropriate

**Monitoring & Reliability**:
- [ ] Health checks configured
- [ ] Monitoring dashboards created
- [ ] Alerting rules defined
- [ ] Log aggregation setup
- [ ] Error tracking enabled
- [ ] Backup strategy verified
- [ ] Disaster recovery plan tested
- [ ] Runbook documentation complete

**Operational Readiness**:
- [ ] CI/CD pipeline tested
- [ ] Rollback procedure validated
- [ ] Database migration strategy verified
- [ ] Team access and permissions configured
- [ ] Documentation updated
- [ ] Support escalation procedures defined

### Go-Live Process

1. **Final Testing** - Complete end-to-end testing
2. **Team Notification** - Alert all stakeholders
3. **Database Migration** - Run production migrations
4. **Application Deployment** - Deploy containers
5. **Health Verification** - Run post-deployment checks
6. **Performance Monitoring** - Watch metrics for 24h
7. **Go-Live Confirmation** - Official launch announcement

---

*For monitoring details, see the [Performance Monitoring Guide](./performance-monitoring.md). For development workflows, see the [Development Guide](./development.md).*