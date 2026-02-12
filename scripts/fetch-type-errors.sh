#!/bin/bash
# Simple type check script
echo "🔍 Running type check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✅ Type check passed!"
else
  echo "❌ Type check failed!"
  exit 1
fi
