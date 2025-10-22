#!/bin/bash

echo "🔧 AUTOMATIC ENVIRONMENT SETUP FOR SMARTSTORE SAAS"
echo "=================================================="

# Database URL
echo "Setting DATABASE_URL..."
vercel env add DATABASE_URL production <<< "postgresql://neondb_owner:npg_X49NDxyvuhQE@ep-red-glade-a1o1dtj4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Authentication
echo "Setting NEXTAUTH_SECRET..."
vercel env add NEXTAUTH_SECRET production <<< "qJecyy7DuoCrS0Xi68Q5Y4gSTrN0Jb9+KdTBn4r1UWU="

echo "Setting NEXTAUTH_URL..."
vercel env add NEXTAUTH_URL production <<< "https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app"

echo "Setting JWT_SECRET..."
vercel env add JWT_SECRET production <<< "3vs2s3mxXu19qPGBS16f3CMvOep6Z5zyNqxaSJJ1/8="

echo "Setting JWT_REFRESH_SECRET..."
vercel env add JWT_REFRESH_SECRET production <<< "3vs2s3mxXu19qPGBS16f3CMvOep6Z5zyNqxaSJJ1/8="

# Security
echo "Setting ENCRYPTION_KEY..."
vercel env add ENCRYPTION_KEY production <<< "NK3kt+KBnyj/WId+yXq8jsfVijks/U/Pm2ZInTOBpp8="

echo "Setting SESSION_SECRET..."
vercel env add SESSION_SECRET production <<< "H7FNxvyFxt618IwFM7vyhDrAfl6JE3kC+l/bqmI0MMw="

echo "Setting MFA_ENCRYPTION_KEY..."
vercel env add MFA_ENCRYPTION_KEY production <<< "GqTNnVJ35jNTHHHHXQdtwMJA4f6B+A3XTaIxWJN27ZE="

# App Configuration
echo "Setting NODE_ENV..."
vercel env add NODE_ENV production <<< "production"

echo "Setting NEXT_PUBLIC_APP_URL..."
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app"

# JWT Configuration
echo "Setting JWT_EXPIRES_IN..."
vercel env add JWT_EXPIRES_IN production <<< "15m"

echo "Setting JWT_REFRESH_EXPIRES_IN..."
vercel env add JWT_REFRESH_EXPIRES_IN production <<< "7d"

# MFA Configuration
echo "Setting MFA_ISSUER..."
vercel env add MFA_ISSUER production <<< "SmartStore"

echo "✅ All environment variables set successfully!"
echo "🚀 Redeploying application..."

# Redeploy
vercel --prod

echo "🎉 Setup complete! Your SmartStore SaaS is ready for client demo!"
