param(
  [switch]$SkipMongoConfig,
  [switch]$SkipMongoRestart,
  [switch]$SkipFrontend,
  [switch]$SkipBackend,
  [int]$BackendPort = 3003
)

$ErrorActionPreference = 'Stop'

function Test-Admin {
  try {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  } catch {
    return $false
  }
}

function Wait-HttpOk {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [int]$Retries = 40,
    [int]$DelayMs = 500
  )

  for ($i = 0; $i -lt $Retries; $i++) {
    try {
      $res = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 2
      return $res
    } catch {
      Start-Sleep -Milliseconds $DelayMs
    }
  }

  throw "Timeout waiting for $Url"
}

function Ensure-MongoConfig {
  param(
    [string]$CfgPath,
    [double]$CacheSizeGb = 0.25
  )

  if (-not (Test-Path -LiteralPath $CfgPath)) {
    throw "mongod.cfg not found at: $CfgPath"
  }

  $raw = Get-Content -LiteralPath $CfgPath -Raw

  $needCache = ($raw -notmatch '(?m)^\s*cacheSizeGB\s*:')
  $needDiag = ($raw -notmatch '(?m)^\s*diagnosticDataCollectionEnabled\s*:')

  if (-not $needCache -and -not $needDiag) {
    return $false
  }

  Copy-Item -LiteralPath $CfgPath -Destination ($CfgPath + '.bak') -Force

  $patched = $raw

  if ($needCache) {
    if ($patched -match '(?ms)^storage:\s*\r?\n\s*dbPath:\s*[^\r\n]+\r?\n') {
      $replacement = "storage:`r`n  dbPath: C:\Program Files\MongoDB\Server\8.2\data`r`n  wiredTiger:`r`n    engineConfig:`r`n      cacheSizeGB: $CacheSizeGb`r`n"
      $patched = [regex]::Replace(
        $patched,
        '(?ms)^storage:\s*\r?\n\s*dbPath:\s*[^\r\n]+\r?\n',
        $replacement,
        1
      )
    } else {
      $patched = $patched.TrimEnd() + "`r`n`r`nstorage:`r`n  dbPath: C:\Program Files\MongoDB\Server\8.2\data`r`n  wiredTiger:`r`n    engineConfig:`r`n      cacheSizeGB: $CacheSizeGb`r`n"
    }
  }

  if ($needDiag) {
    if ($patched -match '(?m)^setParameter:\s*$') {
      $patched = [regex]::Replace(
        $patched,
        '(?m)^setParameter:\s*$',
        "setParameter:`r`n  diagnosticDataCollectionEnabled: false",
        1
      )
    } else {
      $patched = $patched.TrimEnd() + "`r`n`r`nsetParameter:`r`n  diagnosticDataCollectionEnabled: false`r`n"
    }
  }

  Set-Content -LiteralPath $CfgPath -Value $patched -Encoding Ascii
  return $true
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $PSScriptRoot 'drivercv-backend'
$frontendDir = Join-Path $PSScriptRoot 'drivercv-frontend'

$mongoService = 'MongoDB'
$mongoCfg = 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg'

$admin = Test-Admin

if (-not $SkipMongoConfig) {
  if (-not $admin) {
    Write-Host 'WARNING: Not running as Administrator; cannot safely patch mongod.cfg under Program Files.' -ForegroundColor Yellow
  } else {
    $changed = Ensure-MongoConfig -CfgPath $mongoCfg -CacheSizeGb 0.25
    if ($changed) {
      Write-Host 'MongoDB config updated (backup created: mongod.cfg.bak)' -ForegroundColor Green
    } else {
      Write-Host 'MongoDB config already OK' -ForegroundColor Green
    }
  }
}

try {
  $svc = Get-Service -Name $mongoService -ErrorAction Stop
  if ($svc.Status -ne 'Running') {
    if (-not $admin) {
      Write-Host 'WARNING: MongoDB service is not running and current shell is not Administrator. Start it manually (Run as Admin).' -ForegroundColor Yellow
    } else {
      Start-Service -Name $mongoService
    }
  }
} catch {
  Write-Host "WARNING: MongoDB service '$mongoService' not found. Skipping service start." -ForegroundColor Yellow
}

if (-not $SkipMongoRestart -and $admin) {
  try {
    Restart-Service -Name $mongoService -ErrorAction Stop
  } catch {
  }
}

if (-not $SkipBackend) {
  if (-not (Test-Path -LiteralPath $backendDir)) {
    throw "Backend dir not found: $backendDir"
  }

  Start-Process -FilePath 'powershell' -WorkingDirectory $backendDir -ArgumentList @(
    '-NoExit',
    '-Command',
    "$env:PORT=$BackendPort; npm run dev"
  ) | Out-Null
}

if (-not $SkipFrontend) {
  if (-not (Test-Path -LiteralPath $frontendDir)) {
    throw "Frontend dir not found: $frontendDir"
  }

  Start-Process -FilePath 'powershell' -WorkingDirectory $frontendDir -ArgumentList @(
    '-NoExit',
    '-Command',
    'npm run dev'
  ) | Out-Null
}

try {
  $health = Wait-HttpOk -Url "http://localhost:$BackendPort/api/health" -Retries 40 -DelayMs 500
  $mongoReady = $health.mongo.readyState
  if ($mongoReady -ne 1) {
    Write-Host "WARNING: backend health OK but mongo.readyState=$mongoReady" -ForegroundColor Yellow
  } else {
    Write-Host 'Backend health OK (mongo connected)' -ForegroundColor Green
  }

  try {
    $loc = Wait-HttpOk -Url "http://localhost:$BackendPort/api/locations/list?country=TR&level=city" -Retries 30 -DelayMs 500
    $count = 0
    if ($loc -and $loc.list) { $count = @($loc.list).Count }
    if ($count -gt 0) {
      Write-Host "UI ping OK: locations cities ($count)" -ForegroundColor Green
    } else {
      Write-Host 'WARNING: UI ping FAIL: locations cities (empty list)' -ForegroundColor Yellow
    }
  } catch {
    Write-Host 'WARNING: UI ping FAIL: locations list endpoint' -ForegroundColor Yellow
  }

  try {
    $roles = Wait-HttpOk -Url "http://localhost:$BackendPort/api/public/roles/candidate-subroles" -Retries 30 -DelayMs 500
    $count = 0
    if ($roles -and $roles.subRoles) { $count = @($roles.subRoles).Count }
    if ($count -gt 0) {
      Write-Host "UI ping OK: candidate subroles ($count)" -ForegroundColor Green
    } else {
      Write-Host 'WARNING: UI ping FAIL: candidate subroles (empty list)' -ForegroundColor Yellow
    }
  } catch {
    Write-Host 'WARNING: UI ping FAIL: candidate subroles endpoint' -ForegroundColor Yellow
  }
} catch {
  Write-Host "WARNING: backend health check failed (http://localhost:$BackendPort/api/health)" -ForegroundColor Yellow
}
