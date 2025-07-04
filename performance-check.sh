#!/bin/bash

# Maratron Performance Monitoring Script
# Run this to check Redis and PostgreSQL performance

echo "🏃‍♂️ Maratron Performance Health Check"
echo "======================================"
echo ""

# Check if app is running
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    PORT=3002
elif curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    PORT=3001
elif curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    PORT=3000
else
    echo "❌ App not running on ports 3000, 3001, or 3002"
    echo "Run 'npm run dev' first"
    exit 1
fi

echo "✅ App running on port $PORT"
echo ""

# 1. Overall Performance Stats
echo "📊 OVERALL PERFORMANCE"
echo "====================="
curl -s "http://localhost:$PORT/api/performance" | jq '.'
echo ""

# 2. Cache Performance
echo "🚀 REDIS CACHE PERFORMANCE"
echo "=========================="
curl -s "http://localhost:$PORT/api/performance?action=cache" | jq '.cache'
echo ""

# 3. Database Performance  
echo "🗄️ DATABASE PERFORMANCE"
echo "======================="
curl -s "http://localhost:$PORT/api/performance?action=database" | jq '.database'
echo ""

# 4. Simple Health Check
echo "❤️ HEALTH STATUS"
echo "==============="
curl -s "http://localhost:$PORT/api/health" | jq '.'
echo ""

echo "💡 WHAT TO LOOK FOR:"
echo "==================="
echo "✅ Redis Hit Rate: >85% is excellent, >70% is good"
echo "✅ Cache Response Time: <2ms is excellent, <10ms is good"  
echo "✅ Database Query Time: <50ms average, <200ms for complex queries"
echo "✅ Memory Usage: Should be stable, not constantly growing"
echo ""
echo "🔧 To test detailed performance metrics:"
echo "   1. Log into your app to get authenticated"
echo "   2. Performance endpoints require authentication"
echo "   3. Basic health check (above) works without auth"
echo ""
echo "📋 SUMMARY:"
echo "==========="
if curl -s "http://localhost:$PORT/api/health" | jq -r '.status' | grep -q "healthy"; then
    echo "✅ Overall Status: HEALTHY"
    echo "✅ Redis: $(curl -s "http://localhost:$PORT/api/health" | jq -r '.services.redis.status')"
    echo "✅ Database: $(curl -s "http://localhost:$PORT/api/health" | jq -r '.services.database.status')"
else
    echo "❌ Overall Status: UNHEALTHY"
fi