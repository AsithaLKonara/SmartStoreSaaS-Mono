#!/bin/bash
set +e  # Don't exit on error

echo "🔨 Starting production build..."

# Generate Prisma client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Build Next.js app
echo "⚡ Building Next.js application..."
npx next build

# Check if .next directory was created (actual success indicator)
if [ -d ".next" ]; then
  echo "✅ Build completed successfully - .next directory created"
  exit 0
else
  echo "❌ Build failed - .next directory not found"
  exit 1
fi

