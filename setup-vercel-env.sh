#!/bin/bash
# Setup Vercel Environment Variables for https://smartstore-demo.vercel.app

echo "Setting up Vercel Production Environment Variables..."
echo "=================================================="

# Core App URLs
echo "DATABASE_URL" | vercel env add production
echo "https://smartstore-demo.vercel.app" | vercel env add NEXTAUTH_URL production
echo "smartstore-saas-demo-secret-key-2024-production-secure" | vercel env add NEXTAUTH_SECRET production
echo "https://smartstore-demo.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production
echo "https://smartstore-demo.vercel.app/api" | vercel env add NEXT_PUBLIC_API_URL production

echo "✅ Core environment variables configured!"
echo ""
echo "To complete setup, run this script and follow prompts:"
echo "chmod +x setup-vercel-env.sh"
echo "./setup-vercel-env.sh"
echo ""
echo "Or set manually in Vercel Dashboard:"
echo "https://vercel.com/asithalkonaras-projects/smartstore-saas/settings/environment-variables"

