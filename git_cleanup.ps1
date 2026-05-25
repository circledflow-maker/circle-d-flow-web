git reset HEAD~1
git restore --staged .

if (Test-Path "Index.html") {
    git mv Index.html index.tmp
    git mv index.tmp index.html
}

python generate_branded_qr.py

git add .gitignore
git add index.html
git add pages/
git add js/
git add css/
git add Assets/
git add api/
git add generate_branded_qr.py
git add package.json
git add package-lock.json

git commit -m "Migrate to Vercel, fix 404, clean repo, update QR"
