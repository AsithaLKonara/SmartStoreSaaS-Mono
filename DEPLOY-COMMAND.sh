#!/bin/bash
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       🚀 SMARTSTORE SAAS - DEPLOYMENT SCRIPT 🚀         ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Ready to deploy your platform to production!           ║"
echo "║                                                          ║"
echo "║  This will:                                              ║"
echo "║  1. Verify your build                                    ║"
echo "║  2. Deploy to Vercel                                     ║"
echo "║  3. Give you a live URL                                  ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
read -p "Press ENTER to start deployment (or Ctrl+C to cancel)..."
echo ""

echo "📦 Step 1: Final Build Verification..."
npm run build --silent

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    
    echo "🚀 Step 2: Deploying to Vercel..."
    echo ""
    echo "⚠️  IMPORTANT: After deployment, you need to:"
    echo "   1. Add environment variables in Vercel dashboard"
    echo "   2. Run 'vercel --prod' again to redeploy"
    echo ""
    read -p "Press ENTER to continue..."
    
    vercel --prod
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║              ✅ DEPLOYMENT INITIATED! ✅                 ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║                                                          ║"
    echo "║  📝 NEXT STEPS:                                         ║"
    echo "║                                                          ║"
    echo "║  1. Go to Vercel Dashboard                               ║"
    echo "║  2. Add environment variables                            ║"
    echo "║  3. Run: vercel --prod                                   ║"
    echo "║  4. Test your live site!                                 ║"
    echo "║                                                          ║"
    echo "║  📚 Full guide: 🚀-DEPLOY-NOW-GUIDE.md                  ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
else
    echo "❌ Build failed. Please fix errors first."
    exit 1
fi
