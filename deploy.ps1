# Builds the demo and publishes dist/ to the gh-pages branch (GitHub Pages).
# Usage: powershell -ExecutionPolicy Bypass -File deploy.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }

$remote = git remote get-url origin
$name = git config user.name
$email = git config user.email

Push-Location dist
# git writes progress and warnings to stderr, which 'Stop' would turn into terminating errors.
$ErrorActionPreference = 'Continue'
try {
  if (Test-Path .git) { Remove-Item .git -Recurse -Force }
  git init -q -b gh-pages
  git config user.name $name
  git config user.email $email
  git config core.autocrlf false
  git add -A
  git commit -q -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  git push -f $remote gh-pages
  if ($LASTEXITCODE -ne 0) { throw 'Push failed' }
} finally {
  if (Test-Path .git) { Remove-Item .git -Recurse -Force }
  Pop-Location
}
Write-Host 'Deployed: https://amr-bwsla.github.io/ece-technical-office/'
