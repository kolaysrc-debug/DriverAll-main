# Logs / Checklist for Next Session

## Quick health checks (copy/paste)

### 1) Backend health + DB name

- URL:
  - `http://127.0.0.1:3001/api/health`
- Expect:
  - `mongo.name = driverall`

PowerShell:

```powershell
Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/health" | Select-Object -ExpandProperty mongo
```

### 2) Profile-scoped filters payload

- URL:
  - `http://127.0.0.1:3001/api/jobs/filters?country=TR&scope=profile`
- Expect:
  - `success: true`
  - `groups` length > 0

PowerShell:

```powershell
$r = Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/jobs/filters?country=TR&scope=profile"
$r.groups | Select-Object -First 30 groupKey,groupLabel,country,active
```

### 3) Passport/Visa fields exist (no auth required in current setup)

- URL:
  - `http://127.0.0.1:3001/api/admin/fields?activeOnly=true`
- Expect keys:
  - `PASSPORT_TYPE_TR`
  - `VISA_TYPES`

PowerShell:

```powershell
$x = Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/admin/fields?activeOnly=true"
$x.fields | Where-Object { $_.key -in @('PASSPORT_TYPE_TR','VISA_TYPES') } | Select-Object key,label,category,country,active,showInCv,uiType,optionsGroupKey
```

## Known running commands

- Backend (dev):
  - `drivercv-backend`: `npm run dev`
- Frontend (dev):
  - `drivercv-frontend`: `npm run dev`

## OTP / Twilio quick checks (copy/paste)

### 4) Mongo after reboot (Windows)

- If backend returns `503` / DB unavailable or health fails after PC reboot:
  - `services.msc` -> `MongoDB` / `MongoDB Server (MongoDB)` -> Start
  - Set Startup type: `Automatic`

### 5) Backend health (port)

PowerShell:

```powershell
Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:3001/api/health" | Select-Object -ExpandProperty mongo
```

### 6) Admin login -> JWT token

PowerShell:

```powershell
$base = "http://127.0.0.1:3001"
$loginBody = @{ email = "admin@driverall.com"; password = "123456" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Method POST -Uri "$base/api/auth/login" -ContentType "application/json" -Body $loginBody
$token = $loginRes.token
$token
```

### 7) Save Twilio Verify credentials to DB (authToken prompt)

- Requires `.env`:
  - `OTP_SECRETS_MASTER_KEY` (>= 32 chars)

PowerShell:

```powershell
$base = "http://127.0.0.1:3001"
$headers = @{ Authorization = "Bearer $token" }

$accountSid = "AC00abbd8f74734ee9164062d909eb4de1"
$verifyServiceSid = "VA39379feb8ab2c04845dc3082e34a9f6a"

$secureTok = Read-Host "Twilio Auth Token" -AsSecureString
$authToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureTok))

$credBody = @{
  providerKey = "twilioVerify"
  ref = "default"
  accountSid = $accountSid
  verifyServiceSid = $verifyServiceSid
  authToken = $authToken
  isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Method PUT -Uri "$base/api/admin/otp-credentials" -Headers $headers -ContentType "application/json" -Body $credBody | ConvertTo-Json -Depth 6
```

### 8) OTP request / verify smoke test

PowerShell:

```powershell
$base = "http://127.0.0.1:3001"

$otpReq = @{ phone = "+905323047271"; channel = "sms" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "$base/api/auth/otp/request" -ContentType "application/json" -Body $otpReq | ConvertTo-Json -Depth 6

$code = Read-Host "Gelen OTP kodu"
$otpVer = @{ phone = "+905323047271"; code = $code } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "$base/api/auth/otp/verify" -ContentType "application/json" -Body $otpVer | ConvertTo-Json -Depth 6
```

## Notes

- CV UI hides `VISA_TYPES` until `PASSPORT_TYPE_TR` is filled (field meta visibility).
- If default fields ever “come back”, re-check `DeletedDefaultField` tombstone logic and whether the deletion path is writing tombstones.
