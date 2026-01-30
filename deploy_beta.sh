#!/bin/bash
echo "Starting BETA READY Deployment..."

# 1. Reset (Safety First)
git reset --soft HEAD~1
echo "Current directory: $(pwd)"

# 2. Add all changes (including new dashboards and scripts)
git add .

# 3. Commit
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "BETA READY: Kitchen Dashboard, Quest Creator, Onboarding & Stripe Success - $TIMESTAMP"

# 4. Push to main
echo "Pushing Beta Build..."
git push origin main

echo "-----------------------------------"
echo "✅ Beta Deployed!"
echo "Triggering Netlify Build Hook..."
echo "Verify live site for new Onboarding flow and Kitchen Dashboard."
echo "-----------------------------------"
