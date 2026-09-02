# Deploy Kiss Your Heart to Vercel
# Run in PowerShell AFTER: npx vercel login

Set-Location $PSScriptRoot\..

Write-Host "Deploying to Vercel production..."
npx vercel --prod --yes

Write-Host ""
Write-Host "Live URLs:"
Write-Host "  /kyh"
Write-Host "  /kiss-your-heart"
Write-Host "  /create/project-builder"
