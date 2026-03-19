#!/bin/bash
set -e

echo "🚀 Starting Enterprise SaaS Verification Pipeline..."

# 1. Page & API Discovery
echo "🔍 Discovering routes..."
npx tsx scripts/discover-pages.ts
npx tsx scripts/discover-api-routes.ts

# 2. Production Build
SHOULD_BUILD=false
if [ ! -d ".next" ] || [ "$1" == "--build" ] || [ "$2" == "--build" ]; then
  SHOULD_BUILD=true
fi

if [ "$SHOULD_BUILD" == "true" ]; then
  echo "🏗️ Building production app..."
  npx dotenv-cli -e .env.test -- npm run build
else
  echo "⏩ Using existing build..."
fi

# 3. Database Seeding
echo "🌱 Seeding database..."
npx dotenv-cli -e .env.test -- npx tsx prisma/fullSeed.ts

# 4. Run Playwright Tests (Advanced Config)
# Detect runs from $1 or $2
RUNS=1
if [[ "$1" =~ ^[0-9]+$ ]]; then
  RUNS=$1
elif [[ "$2" =~ ^[0-9]+$ ]]; then
  RUNS=$2
fi
echo "🧪 Running Tests ($RUNS pass(es))..."

for i in $(seq 1 $RUNS)
do
  echo "🏃 Run #$i of $RUNS..."
  npx dotenv-cli -e .env.test -- npx playwright test tests/e2e/advanced/api-health.spec.ts --config playwright.advanced.config.ts
done

echo "✅ Pipeline Completed! Open 'advanced-report/index.html' for results."
