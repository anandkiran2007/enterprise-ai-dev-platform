#!/bin/bash
echo "🚀 Starting Enterprise AI Dev Platform in Containers..."

# Build and start in detached mode
# Try `docker compose` (v2) first, falling back to `docker-compose` (v1)
if docker compose version >/dev/null 2>&1; then
    docker compose up --build -d
else
    docker-compose up --build -d
fi

echo "✅ Services Started!"
echo "   - Agent Platform: http://localhost:3000"
echo "   - Dashboard UI:   http://localhost:3001"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop:      docker-compose down"
