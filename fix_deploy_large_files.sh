#!/bin/bash
echo "⚠️  Detecting Large Files & Fixing Deployment..."

# 1. Reset the last commit (soft reset to keep changes staged)
git reset --soft HEAD~1
echo "✅ Last commit undone (changes preserved)"

# 2. Force remove large files from staging and tracking
echo "Removing large files from git tracking..."
git reset HEAD "Multiversos.pdf"
git reset HEAD "PRODUCT_LAB-20260126T205805Z-3-001.zip"
git reset HEAD "DJ in flow.MOV"

git rm --cached "Multiversos.pdf" 2>/dev/null
git rm --cached "PRODUCT_LAB-20260126T205805Z-3-001.zip" 2>/dev/null
git rm --cached "DJ in flow.MOV" 2>/dev/null

# 3. Update .gitignore to ensure they stay ignored
echo "" >> .gitignore
echo "# Large Files Excluded from Repo" >> .gitignore
echo "Multiversos.pdf" >> .gitignore
echo "PRODUCT_LAB-20260126T205805Z-3-001.zip" >> .gitignore
echo "*.pdf" >> .gitignore
echo "*.zip" >> .gitignore
echo "*.MOV" >> .gitignore

# 4. Re-add everything else and commit
echo "Re-staging valid files..."
git add .
git commit -m "UX Evolution Update (Fixed: Removed Large Files)"

# 5. Push to main
echo "Pushing optimized build..."
git push origin main

echo "-----------------------------------"
echo "✅ FIXED & DEPLOYED!"
echo "Large files were removed from Git but remain on your disk."
echo "-----------------------------------"
