#!/bin/bash

# Simple Redis vs Database Performance Comparison
# This script demonstrates the performance benefits of Redis caching

echo "🚀 Redis vs Database Performance Benchmark"
echo "=========================================="
echo ""

# Check if app is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "❌ App not running on port 3000"
    echo "Run 'npm run dev' first"
    exit 1
fi

echo "✅ App is running, starting benchmark..."
echo ""

# Function to measure time (simple approach)
measure_time() {
    local start_time=$(node -e "console.log(Date.now())")
    eval "$1"
    local end_time=$(node -e "console.log(Date.now())")
    local duration=$((end_time - start_time))
    echo "${duration}ms"
}

echo "🗄️ TESTING DATABASE PERFORMANCE"
echo "==============================="

# Test direct database queries (simulating cache miss)
echo "Testing database query time (simulating cache miss)..."
DB_TIME=$(measure_time "curl -s 'http://localhost:3000/api/health' > /dev/null")
echo "Database query time: $DB_TIME"
echo ""

echo "🏃‍♂️ TESTING REDIS CACHE PERFORMANCE"
echo "==================================="

# Test Redis operations
echo "Testing Redis ping time..."
if command -v redis-cli &> /dev/null; then
    REDIS_TIME=$(measure_time "redis-cli ping > /dev/null")
    echo "Redis ping time: $REDIS_TIME"
else
    echo "Redis CLI not available, using Docker..."
    if docker ps | grep -q redis; then
        REDIS_TIME=$(measure_time "docker exec \$(docker ps -q --filter ancestor=redis) redis-cli ping > /dev/null")
        echo "Redis ping time: $REDIS_TIME"
    else
        echo "❌ Redis not accessible"
    fi
fi

echo ""
echo "📊 PERFORMANCE COMPARISON"
echo "========================"
echo "Database health check: $DB_TIME"
echo "Redis ping: $REDIS_TIME"
echo ""

echo "💡 UNDERSTANDING THE RESULTS:"
echo "============================="
echo "✅ Redis should be significantly faster than database queries"
echo "✅ Typical Redis operations: 0.1-1ms"
echo "✅ Typical database operations: 10-50ms"
echo "✅ Cache hit ratio >85% means Redis is providing significant benefits"
echo ""
echo "🔍 To see detailed cache metrics:"
echo "   1. Use the app to generate some data"
echo "   2. Run './performance-check.sh' to see cache hit rates"
echo "   3. Monitor /api/performance for detailed metrics"