#!/bin/bash
echo "Starting UX Evolution Deployment..."

# 1. Check Directory
echo "Current directory: $(pwd)"

# 2. Add all changes (including new assets if any)
git add .

# 3. Commit
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "UX Evolution Update: Hero, Sticky Nav, Gamification UI, News Section - $TIMESTAMP"

# 4. Push to main
echo "Pushing to repository..."
git push origin main

echo "-----------------------------------"
echo "✅ UX Update Deployed!"
echo "Triggering Netlify Build..."
echo "Please wait 1-2 minutes for the live site to update."
echo "-----------------------------------"
