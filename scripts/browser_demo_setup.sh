#!/bin/bash
# SmartStore SaaS Browser Demo Setup
# Launches the dev server with fixed PATH for the agent environment

export PATH="/usr/local/bin:$PATH"

echo "🚀 Starting SmartStore SaaS Development Server..."
cd /Users/asithalakmal/Documents/web/SmartStoreSaaS-Mono-main

# Ensure prisma is generated
/usr/local/bin/npx prisma generate

# Start dev server
/usr/local/bin/npm run dev
