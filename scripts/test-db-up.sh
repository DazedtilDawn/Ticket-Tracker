#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker to run database tests."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

echo "Starting test database..."
docker compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
for i in {1..30}; do
  if docker compose -f docker-compose.test.yml exec -T postgres_test pg_isready -U postgres -d intelliticket_test >/dev/null 2>&1; then
    echo "Database is ready!"
    
    # --- run migrations for test DB ---
    export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/intelliticket_test
    echo "Running test-database migrations…"
    npx tsx tests/setupTestDb.ts || { echo "❌  Migration step failed"; exit 1; }
    echo "✅  Test DB ready!"
    
    exit 0
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "Error: Database failed to start within 30 seconds"
exit 1