#!/bin/bash

# RapidAPI Lead Miner Deployment Script
echo "🚀 RapidAPI Lead Miner Deployment Setup"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📁 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Creating commit..."
    git commit -m "feat: Complete RapidAPI Lead Miner platform with quota management and bulk processing"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Create a GitHub repository at https://github.com/new"
echo "2. Copy the repository URL"
echo "3. Run: git remote add origin <your-github-url>"
echo "4. Run: git push -u origin main"
echo ""
echo "🌐 For Vercel deployment:"
echo "1. Go to https://vercel.com"
echo "2. Import your GitHub repository"
echo "3. Add RAPIDAPI_KEY environment variable"
echo "4. Deploy!"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"