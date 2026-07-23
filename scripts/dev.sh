#!/usr/bin/env bash
set -e

echo "Starting AlgoWeb Monorepo Local Environment..."
docker-compose up -d mongo redis
echo "Starting Backend API..."
(cd backend && uvicorn app.main:app --reload --port 8000) &
echo "Starting Frontend Next.js..."
(cd frontend && pnpm dev)
