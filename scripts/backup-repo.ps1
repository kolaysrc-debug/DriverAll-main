param(
  [string]$OutDir = "backups"
)

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backupDir = Join-Path $root $OutDir
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$zip = Join-Path $backupDir ("DriverAll-backup-$ts.zip")

$files = Get-ChildItem -Path $root -Recurse -File -Force |
  Where-Object {
    $p = $_.FullName

    $p -notlike "*\\.git\\*" -and
    $p -notlike "*\\node_modules\\*" -and
    $p -notlike "*\\.next\\*" -and
    $p -notlike "*\\backups\\*" -and
    $p -notlike "*\\handoff\\latest.json"
  }

if (-not $files -or $files.Count -eq 0) {
  throw "No files found to backup."
}

Compress-Archive -Path $files.FullName -DestinationPath $zip -Force

Write-Host "Backup zip created:" -ForegroundColor Green
Write-Host $zip
