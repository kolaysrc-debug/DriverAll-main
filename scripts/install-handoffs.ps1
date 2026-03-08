$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Setting git hooks path to .githooks ..." -ForegroundColor Cyan

# Ensure git exists
$git = Get-Command git -ErrorAction Stop

# Configure local repo hooksPath
& git config core.hooksPath .githooks

Write-Host "OK: core.hooksPath=.githooks" -ForegroundColor Green
Write-Host "Next: make sure pre-commit is executable in your git environment (Git Bash)." -ForegroundColor Yellow
Write-Host "Test: run a commit; it should generate handoff/latest.md and handoff/latest.json" -ForegroundColor Yellow
