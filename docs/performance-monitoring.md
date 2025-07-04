# Performance Monitoring Guide

This guide explains how to monitor Redis and PostgreSQL performance in your Maratron application.

## Quick Start

### 1. Basic Health Check
```bash
./performance-check.sh
```

This script checks if Redis and PostgreSQL are working properly and provides a health summary.

### 2. Performance Benchmarking
```bash
./redis-benchmark.sh
```

This script compares Redis cache performance vs database performance.

## Available Endpoints

### Health Check (No Auth Required)
```bash
curl http://localhost:3000/api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-04T05:51:39.246Z",
  "services": {
    "redis": {
      "status": "healthy", 
      "enabled": true
    },
    "database": {
      "status": "healthy",
      "error": null
    }
  }
}
```

### Performance Metrics (Auth Required)

#### Overall Performance
```bash
curl http://localhost:3000/api/performance
```

#### Cache Performance
```bash
curl http://localhost:3000/api/performance?action=cache
```

#### Database Performance
```bash
curl http://localhost:3000/api/performance?action=database
```

## Key Performance Indicators

### Redis Cache Performance
- **Hit Rate**: >85% excellent, >70% good
- **Response Time**: <2ms excellent, <10ms good
- **Memory Usage**: Should be stable, not constantly growing

### Database Performance
- **Query Time**: <50ms average, <200ms for complex queries
- **Connection Pool**: Monitor active connections
- **Query Performance**: Track slow queries

## Monitoring in Production

### 1. Health Monitoring
Set up automated health checks:
```bash
# Add to cron job
0 */6 * * * /path/to/performance-check.sh >> /var/log/maratron-health.log
```

### 2. Performance Alerts
Monitor these metrics:
- Redis connection failures
- Database query timeouts
- Memory usage spikes
- Cache hit rate drops

### 3. Log Analysis
Key log patterns to monitor:
- `Error fetching performance stats`
- `Health check failed`
- `Cache operation failed`
- `Database connection timeout`

## Troubleshooting

### Redis Issues
1. **Connection Failed**: Check Redis container/service
2. **High Memory Usage**: Review cache eviction policies
3. **Low Hit Rate**: Analyze cache key patterns

### Database Issues
1. **Slow Queries**: Check query execution plans
2. **Connection Pool Exhaustion**: Monitor connection usage
3. **Lock Contention**: Analyze concurrent operations

## Performance Optimization

### Redis Optimization
- Set appropriate TTL values
- Use compression for large values
- Implement cache warming strategies
- Monitor memory usage patterns

### Database Optimization
- Add appropriate indexes
- Optimize query patterns
- Use connection pooling
- Monitor slow query logs

## Benefits Analysis

### When Redis is Working Well
- 85%+ cache hit rate
- <2ms cache response times
- Reduced database load
- Improved user experience

### When Database is Optimized
- <50ms average query times
- Stable connection pool usage
- No query timeouts
- Efficient index usage

## Scripts Reference

### performance-check.sh
- Comprehensive health and performance check
- Works without authentication for basic health
- Provides actionable insights

### redis-benchmark.sh
- Compares Redis vs database performance
- Helps quantify caching benefits
- Provides performance baselines

## Best Practices

1. **Regular Monitoring**: Run health checks regularly
2. **Performance Baselines**: Establish baseline metrics
3. **Alerting**: Set up alerts for critical metrics
4. **Optimization**: Continuously optimize based on metrics
5. **Documentation**: Keep performance logs for trend analysis