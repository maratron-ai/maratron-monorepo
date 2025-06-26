#!/bin/bash
set -e

echo "Connecting to existing database on host machine..."

# Generate Prisma client
cd /app/web
npx prisma generate

# Test database connection and apply schema changes
echo "Testing database connection..."
npx prisma db push --accept-data-loss

# Start both applications in background
echo "Starting Maratron AI server..."
cd /app/ai && uv run python run_server.py &

echo "Starting Maratron Web application..."
cd /app/web && npm run dev &

# Keep container running
wait