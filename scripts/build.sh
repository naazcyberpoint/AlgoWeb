#!/usr/bin/env bash
set -e

echo "Building AlgoWeb Production Bundles..."
pnpm --filter frontend build
echo "Build complete."
