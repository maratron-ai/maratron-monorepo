#!/bin/bash
set -e

echo "🚀 Starting Maratron containerized development environment..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
cd /app/web
until npx prisma db push --accept-data-loss --force-reset 2>/dev/null; do
  echo "   PostgreSQL is unavailable - sleeping..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Verify database schema
echo "🔍 Verifying database connection..."
npx prisma db push --accept-data-loss

# Optional: Seed database if seed script exists
if [ -f "package.json" ] && npm run | grep -q "db:seed"; then
  echo "🌱 Seeding database with test data..."
  npm run db:seed || echo "⚠️  Seeding failed or no seed data available"
fi

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until redis-cli -h redis ping 2>/dev/null; do
  echo "   Redis is unavailable - sleeping..."
  sleep 1
done
echo "✅ Redis is ready!"

# Function for graceful shutdown
shutdown() {
    echo "🛑 Shutting down services gracefully..."
    
    # Send SIGTERM to child processes
    if [ ! -z "$AI_PID" ] && kill -0 $AI_PID 2>/dev/null; then
        echo "   Stopping AI server..."
        kill -TERM $AI_PID 2>/dev/null
        wait $AI_PID 2>/dev/null
    fi
    
    if [ ! -z "$WEB_PID" ] && kill -0 $WEB_PID 2>/dev/null; then
        echo "   Stopping web server..."
        kill -TERM $WEB_PID 2>/dev/null
        wait $WEB_PID 2>/dev/null
    fi
    
    echo "✅ All services stopped"
    exit 0
}

# Setup signal handlers for graceful shutdown
trap shutdown SIGTERM SIGINT

# Start AI server in background with proper error handling
echo "🤖 Starting Maratron AI server..."
cd /app/ai
(
    # Set up Python environment properly
    export PYTHONPATH="/app/ai/src:$PYTHONPATH"
    export PYTHONUNBUFFERED=1
    
    # Run with proper event loop handling using a Python script
    uv run python run_server.py
) &
AI_PID=$!

# Start web application in background
echo "🌐 Starting Maratron Web application..."
cd /app/web
(
    # .next directory created with proper ownership in Dockerfile
    # Start Next.js with turbo for better performance
    npm run dev
) &
WEB_PID=$!

echo "🎉 Maratron development environment is ready!"
echo "   Web app: http://localhost:3000"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep container running and wait for both processes
wait $AI_PID $WEB_PID