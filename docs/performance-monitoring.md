# 📊 Performance Monitoring Guide

This guide covers Maratron's enterprise-grade performance monitoring system, including real-time metrics, health checks, alerting, and optimization strategies.

## 🎯 Overview

Maratron includes comprehensive performance monitoring capabilities designed for production environments:

- **Real-time Performance Metrics** - System health, memory usage, response times
- **Redis Cache Analytics** - Hit rates, memory usage, operation statistics
- **Database Performance Monitoring** - Query performance, connection pool health, slow query detection
- **Automated Alerting** - Threshold-based alerts for performance degradation
- **Health Check Endpoints** - Simplified monitoring for external systems

## 📈 Monitoring Endpoints

### Application Performance Overview

```http
GET /api/performance
```

**Purpose**: Comprehensive system health and performance metrics

**Response Example**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 123456,
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB",
    "percentage": 8.8
  },
  "database": {
    "healthy": true,
    "connectionPool": {
      "active": 2,
      "idle": 8,
      "total": 10
    },
    "averageQueryTime": "12ms"
  },
  "cache": {
    "enabled": true,
    "healthy": true,
    "stats": {
      "hits": 1248,
      "misses": 152,
      "total": 1400,
      "hitRate": 89.1,
      "errors": 0
    }
  }
}
```

**Key Metrics**:
- **System Health Status** - Overall application health
- **Memory Usage** - Current memory consumption and limits
- **Database Performance** - Connection pool status and query performance
- **Cache Performance** - Hit rates and error statistics
- **Uptime Tracking** - Application availability metrics

### Cache Performance Analytics

```http
GET /api/performance?action=cache
```

**Purpose**: Detailed Redis cache performance and strategy analysis

**Response Example**:
```json
{
  "cache": {
    "enabled": true,
    "healthy": true,
    "connectionStatus": "connected",
    "stats": {
      "hits": 2847,
      "misses": 356,
      "total": 3203,
      "hitRate": 88.9,
      "errors": 0,
      "operations": {
        "get": 3203,
        "set": 425,
        "delete": 89,
        "invalidate": 12
      }
    },
    "redisInfo": {
      "redis_version": "7.0.0",
      "used_memory_human": "2.1M",
      "used_memory_peak_human": "3.8M",
      "connected_clients": "3",
      "total_commands_processed": "15234",
      "instantaneous_ops_per_sec": "127",
      "keyspace_hits": "2847",
      "keyspace_misses": "356"
    },
    "cacheStrategies": {
      "USER_PROFILE": {
        "ttl": 900,
        "hits": 1245,
        "misses": 89,
        "hitRate": 93.3
      },
      "USER_RUNS": {
        "ttl": 300,
        "hits": 892,
        "misses": 156,
        "hitRate": 85.1
      },
      "LEADERBOARD": {
        "ttl": 600,
        "hits": 456,
        "misses": 67,
        "hitRate": 87.2
      },
      "SOCIAL_FEED": {
        "ttl": 180,
        "hits": 254,
        "misses": 44,
        "hitRate": 85.2
      }
    }
  }
}
```

**Key Insights**:
- **Strategy Performance** - Hit rates per cache type
- **Memory Usage** - Current and peak Redis memory consumption
- **Operation Statistics** - Detailed cache operation metrics
- **Connection Health** - Redis server status and client connections

### Database Performance Metrics

```http
GET /api/performance?action=database
```

**Purpose**: Database health, query performance, and optimization insights

**Response Example**:
```json
{
  "database": {
    "healthy": true,
    "connectionStatus": "connected",
    "pool": {
      "active": 3,
      "idle": 7,
      "total": 10,
      "waiting": 0
    },
    "performance": {
      "averageQueryTime": "8.3ms",
      "slowestQuery": "45ms",
      "totalQueries": 15432,
      "queriesPerSecond": 12.4
    },
    "tableStats": {
      "Users": {
        "rows": 156,
        "size": "2.1MB",
        "indexHitRate": 99.2
      },
      "Runs": {
        "rows": 3245,
        "size": "12.8MB",
        "indexHitRate": 97.8
      },
      "Shoes": {
        "rows": 489,
        "size": "1.2MB",
        "indexHitRate": 98.9
      }
    },
    "recentSlowQueries": [
      {
        "query": "SELECT * FROM \"Runs\" WHERE ...",
        "duration": "45ms",
        "timestamp": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Performance Insights**:
- **Connection Pool Health** - Active, idle, and waiting connections
- **Query Performance** - Average response times and throughput
- **Table Statistics** - Row counts, sizes, and index effectiveness
- **Slow Query Detection** - Identification of performance bottlenecks

### Performance Alerts

```http
GET /api/performance/alerts
```

**Purpose**: Current performance alerts and warnings

**Response Example**:
```json
{
  "alerts": [
    {
      "type": "warning",
      "category": "cache",
      "message": "Cache hit rate below 85% for USER_RUNS strategy",
      "metric": "hit_rate",
      "value": 82.3,
      "threshold": 85,
      "timestamp": "2024-01-15T09:45:00.000Z"
    },
    {
      "type": "info",
      "category": "database",
      "message": "Average query time increased to 15ms",
      "metric": "avg_query_time",
      "value": 15.2,
      "threshold": 10,
      "timestamp": "2024-01-15T09:30:00.000Z"
    }
  ],
  "summary": {
    "critical": 0,
    "warning": 1,
    "info": 1,
    "total": 2
  }
}
```

**Alert Categories**:
- **Critical** - Immediate attention required (service degradation)
- **Warning** - Performance degradation detected
- **Info** - Notable performance changes

### Simple Health Check

```http
GET /api/health
```

**Purpose**: Simplified health check for external monitoring systems

**Response Example**:
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "mcp": "healthy"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Status Values**:
- `healthy` - All systems operational
- `degraded` - Some performance issues
- `unhealthy` - Critical issues detected

## 📊 Performance Benchmarks & Targets

### Expected Performance Targets

| Metric | Target | Threshold | Critical |
|--------|--------|-----------|----------|
| **Cache Hit Rate** | >90% | <85% | <70% |
| **API Response Time** | <100ms | >300ms | >1000ms |
| **Database Query Time** | <50ms | >200ms | >500ms |
| **Redis Operations** | >2000/sec | <1000/sec | <500/sec |
| **Memory Usage** | <512MB | >768MB | >1024MB |
| **Connection Pool** | <50% used | >80% used | >95% used |

### Cache Strategy Performance Expectations

| Strategy | TTL | Expected Hit Rate | Typical Usage |
|----------|-----|-------------------|---------------|
| **USER_PROFILE** | 15min | >90% | User authentication, profile data |
| **USER_RUNS** | 5min | >85% | Recent activity, statistics |
| **LEADERBOARD** | 10min | >95% | Group rankings, competitions |
| **SOCIAL_FEED** | 3min | >80% | Posts, comments, interactions |

## 🔧 Real-Time Monitoring Tools

### Command Line Monitoring

```bash
# Monitor overall performance
watch -n 5 'curl -s "http://localhost:3000/api/performance" | jq ".memory, .database.performance, .cache.stats"'

# Monitor cache performance specifically
watch -n 5 'curl -s "http://localhost:3000/api/performance?action=cache" | jq ".cache.stats"'

# Monitor database performance
watch -n 5 'curl -s "http://localhost:3000/api/performance?action=database" | jq ".database.performance"'

# Check for performance alerts
curl "http://localhost:3000/api/performance/alerts" | jq '.alerts[] | select(.type == "critical" or .type == "warning")'
```

### Redis Monitoring

```bash
# Direct Redis monitoring (if containerized)
docker exec -it maratron-redis redis-cli INFO stats
docker exec -it maratron-redis redis-cli INFO memory
docker exec -it maratron-redis redis-cli MONITOR

# Cache key analysis
curl "http://localhost:3000/api/performance/cache/keys?pattern=user:*" | jq '.keys'
```

### Database Monitoring

```bash
# Direct PostgreSQL monitoring (if containerized)
docker exec -it maratron-postgres psql -U maratron -d maratrondb -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# Connection monitoring
docker exec -it maratron-postgres psql -U maratron -d maratrondb -c "
  SELECT * FROM pg_stat_activity 
  WHERE state = 'active';
"
```

## 🚨 Alerting & Thresholds

### Automated Alert Conditions

**Critical Alerts**:
- Cache hit rate below 70%
- Average query time above 500ms
- Memory usage above 90%
- Redis connection failures
- Database connection pool exhausted

**Warning Alerts**:
- Cache hit rate below 85%
- Average query time above 200ms
- Memory usage above 75%
- Slow queries detected (>100ms)

**Info Alerts**:
- Cache hit rate changes >10%
- Query time increases >50%
- Memory usage increases >25%

### Custom Alert Integration

```typescript
// Example: Custom alert webhook integration
export async function checkPerformanceThresholds() {
  const metrics = await fetch('/api/performance').then(r => r.json());
  
  if (metrics.cache.stats.hitRate < 85) {
    await sendAlert({
      type: 'warning',
      message: `Cache hit rate dropped to ${metrics.cache.stats.hitRate}%`,
      webhook: process.env.SLACK_WEBHOOK_URL
    });
  }
  
  if (metrics.database.performance.averageQueryTime > 200) {
    await sendAlert({
      type: 'warning', 
      message: `Average query time increased to ${metrics.database.performance.averageQueryTime}ms`,
      webhook: process.env.SLACK_WEBHOOK_URL
    });
  }
}
```

## 📈 Performance Optimization Strategies

### Cache Optimization

**High Hit Rate Strategies**:
```typescript
// Implement cache warming for critical data
await cacheManager.warmup(['USER_PROFILE', 'LEADERBOARD'], {
  userIds: mostActiveUsers,
  force: false
});

// Use longer TTLs for stable data
cache.leaderboard(groupId, 'weekly', fetchLeaderboard, {
  ttl: 3600, // 1 hour for weekly data
  compress: true
});

// Implement cache-aside pattern with fallbacks
const userData = await cache.user.profile(userId, async () => {
  return await prisma.user.findUnique({ where: { id: userId } });
}, { ttl: 900, fallbackOnError: true });
```

**Cache Invalidation Strategies**:
```typescript
// Tag-based invalidation for related data
await cacheManager.invalidateByTags(['user', 'runs']); // Invalidates all user run data
await cacheManager.invalidateByTags(['leaderboard']); // Invalidates all leaderboards

// Specific key invalidation
await cacheManager.delete(`user:profile:${userId}`);
```

### Database Optimization

**Query Optimization**:
```typescript
// Use selective field queries
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    // Don't select large fields unless needed
  }
});

// Implement pagination for large datasets
const runs = await prisma.run.findMany({
  where: { userId },
  orderBy: { date: 'desc' },
  take: 20,
  skip: page * 20
});

// Use database connections efficiently
const results = await prisma.$transaction([
  prisma.user.update({ where: { id: userId }, data: userData }),
  prisma.run.create({ data: runData })
]);
```

**Index Optimization**:
```sql
-- Key indexes for performance
CREATE INDEX CONCURRENTLY idx_runs_user_date ON "Runs"("userId", "date" DESC);
CREATE INDEX CONCURRENTLY idx_shoes_user_active ON "Shoes"("userId") WHERE "retired" = false;
CREATE INDEX CONCURRENTLY idx_posts_social_created ON "Posts"("socialProfileId", "createdAt" DESC);
```

### Memory Management

**Container Memory Limits**:
```yaml
# docker-compose.yml memory configuration
services:
  web:
    mem_limit: 512m
    memswap_limit: 512m
  postgres:
    mem_limit: 1g
    memswap_limit: 1g
  redis:
    mem_limit: 256m
    memswap_limit: 256m
```

**Node.js Memory Optimization**:
```bash
# Set Node.js memory limits
NODE_OPTIONS="--max-old-space-size=512" npm run start

# Enable garbage collection monitoring
NODE_OPTIONS="--expose-gc --trace-gc" npm run dev
```

## 🔍 Debugging Performance Issues

### Identifying Bottlenecks

**1. Cache Performance Issues**:
```bash
# Check cache hit rates by strategy
curl "http://localhost:3000/api/performance?action=cache" | jq '.cache.cacheStrategies'

# Monitor cache operations in real-time
docker exec -it maratron-redis redis-cli MONITOR | grep -E "(GET|SET|DEL)"

# Check for cache memory pressure
curl "http://localhost:3000/api/performance?action=cache" | jq '.cache.redisInfo.used_memory_human'
```

**2. Database Performance Issues**:
```bash
# Identify slow queries
curl "http://localhost:3000/api/performance?action=database" | jq '.database.recentSlowQueries'

# Check connection pool utilization
curl "http://localhost:3000/api/performance?action=database" | jq '.database.pool'

# Monitor database activity
docker exec -it maratron-postgres psql -U maratron -d maratrondb -c "
  SELECT pid, state, query_start, query 
  FROM pg_stat_activity 
  WHERE state != 'idle' 
  ORDER BY query_start;
"
```

**3. Memory Leak Detection**:
```bash
# Monitor memory usage trends
watch -n 10 'curl -s "http://localhost:3000/api/performance" | jq ".memory"'

# Check for memory pressure alerts
curl "http://localhost:3000/api/performance/alerts" | jq '.alerts[] | select(.category == "memory")'
```

### Performance Profiling

**Application Profiling**:
```bash
# Enable Node.js performance profiling
NODE_OPTIONS="--prof" npm run start

# Generate flamegraphs for CPU analysis
node --prof-process isolate-*.log > performance.txt

# Memory heap analysis
node --inspect npm run start
# Then connect Chrome DevTools to chrome://inspect
```

**Load Testing**:
```bash
# API endpoint load testing
hey -n 1000 -c 10 -H "Accept: application/json" http://localhost:3000/api/users

# Cache performance under load
ab -n 1000 -c 20 http://localhost:3000/api/performance?action=cache

# Database performance testing
pgbench -h localhost -p 5432 -U maratron -c 10 -t 1000 maratrondb
```

## 📋 Production Monitoring Checklist

### Pre-Deployment Performance Validation

- [ ] **Cache Hit Rates** - All strategies >85%
- [ ] **Database Queries** - No queries >100ms average
- [ ] **Memory Usage** - <75% of allocated limits
- [ ] **Connection Pools** - <50% utilization under normal load
- [ ] **Error Rates** - <0.1% error rate across all endpoints
- [ ] **Load Testing** - Performance maintained under 10x normal load

### Ongoing Monitoring Setup

- [ ] **Automated Alerts** - Configure webhook integration
- [ ] **Dashboard Integration** - Grafana/DataDog setup
- [ ] **Log Aggregation** - Centralized logging (ELK Stack)
- [ ] **Uptime Monitoring** - External health check monitoring
- [ ] **Performance Baselines** - Establish baseline metrics
- [ ] **Capacity Planning** - Resource usage trend analysis

### Performance Review Schedule

- **Daily**: Check performance alerts and critical metrics
- **Weekly**: Review cache hit rates and optimization opportunities  
- **Monthly**: Analyze performance trends and capacity planning
- **Quarterly**: Full performance audit and optimization review

---

*For additional performance optimization strategies, see the [Development Guide](./development.md) and [Architecture Overview](./architecture.md).*