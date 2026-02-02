#!/bin/bash
echo "Starting Force Sync for Circle D Flow..."

# 1. Ensure we are in the right directory (handled by where this script is run)
echo "Current directory: $(pwd)"

# 2. Check for critical files
if [ ! -f "index.html" ] || [ ! -f "dashboard.html" ] || [ ! -f "sw.js" ] || [ ! -f "netlify.toml" ]; then
    echo "ERROR: Critical files missing! Please check directory."
    exit 1
fi

echo "Critical files found..."

# 3. Add all files (fixes missing new files)
git add .

# 4. Commit with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "Force Sync: Major Update $TIMESTAMP - Added netlify.toml and sw.js v4"

# 5. Push to main
echo "Pushing to repository..."
git push origin main

echo "-----------------------------------"
echo "✅ Push completed!"
echo "Netlify should detect the commit and start building immediately."
echo "Please check your live site in 1-2 minutes."
echo "-----------------------------------"
