param(
  [string]$BaseUrl = "http://127.0.0.1:3003",
  [string]$AdminEmail = "admin@driverall.com",
  [string]$TwilioAccountSid = "AC00abbd8f74734ee9164062d909eb4de1",
  [string]$TwilioVerifyServiceSid = "VA39379feb8ab2c04845dc3082e34a9f6a"
)

$ErrorActionPreference = 'Stop'

function ToPlain([SecureString]$sec) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Print-EndpointStatus {
  param([string]$Url)
  try {
    $r = Invoke-WebRequest -Method Get -Uri $Url -TimeoutSec 5 -ErrorAction Stop
    Write-Host "STATUS=$($r.StatusCode) URL=$Url" -ForegroundColor Green
    return
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $code = [int]$resp.StatusCode
      Write-Host "STATUS=$code URL=$Url" -ForegroundColor Yellow
      try {
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $sr.ReadToEnd()
        if ($body) { Write-Host $body }
      } catch {}
      return
    }
    Write-Host "ERROR URL=$Url :: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host "== Health check ==" -ForegroundColor Cyan
Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/health" -TimeoutSec 5 | ConvertTo-Json -Depth 6

Write-Host "== Endpoint visibility checks (expect 401/403 if mounted) ==" -ForegroundColor Cyan
Print-EndpointStatus -Url "$BaseUrl/api/admin/otp-credentials"
Print-EndpointStatus -Url "$BaseUrl/api/admin/otp-config?country=TR"

Write-Host "== Admin login ==" -ForegroundColor Cyan
$AdminPassword = Read-Host "Admin password" -AsSecureString
$AdminPasswordPlain = ToPlain $AdminPassword

$loginBody = @{ email = $AdminEmail; password = $AdminPasswordPlain } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody
$jwt = $loginRes.token
if (-not $jwt) { throw "Admin login token alınamadı" }

Write-Host "== Twilio credential save (DB encrypted) ==" -ForegroundColor Cyan
$TwilioAuthToken = Read-Host "Twilio Auth Token" -AsSecureString
$TwilioAuthTokenPlain = ToPlain $TwilioAuthToken

$credBody = @{
  providerKey = "twilioVerify"
  ref = "default"
  isActive = $true
  accountSid = $TwilioAccountSid
  authToken = $TwilioAuthTokenPlain
  verifyServiceSid = $TwilioVerifyServiceSid
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $jwt" }
Invoke-RestMethod -Method Put -Uri "$BaseUrl/api/admin/otp-credentials" -Headers $headers -ContentType "application/json" -Body $credBody | ConvertTo-Json -Depth 10

Write-Host "== OTP request ==" -ForegroundColor Cyan
$TestPhone = Read-Host "Test phone (ornek: 05xxxxxxxxx)"
$otpReqBody = @{ country = "TR"; phone = $TestPhone } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/otp/request" -ContentType "application/json" -Body $otpReqBody | ConvertTo-Json -Depth 10
