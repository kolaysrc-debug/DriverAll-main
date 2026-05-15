# Windows: projeyi GCP VM'e kopyalar
# Kullanım: .\kurulum\upload-to-gcp.ps1 -VmIp "34.x.x.x" -User "sizin_kullanici"

param(
    [Parameter(Mandatory = $true)]
    [string] $VmIp,
    [string] $User = "",
    [string] $RemotePath = "~/driverall"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

if (-not $User) {
    $User = Read-Host "VM SSH kullanıcı adı (GCP'de genelde e-postanızın @ öncesi)"
}

$Dest = "${User}@${VmIp}:${RemotePath}"
Write-Host "Kopyalanıyor: $Root -> $Dest"
Write-Host "(İlk seferde 'yes' ve şifre/anahtar sorulabilir)"

ssh "${User}@${VmIp}" "mkdir -p $RemotePath"
scp -r "$Root\*" "${User}@${VmIp}:${RemotePath}/"

Write-Host ""
Write-Host "Tamam. VM'de SSH ile bağlanıp şunları çalıştırın:"
Write-Host "  cd $RemotePath"
Write-Host "  sudo bash kurulum/gcp-vm-setup.sh"
Write-Host "  bash kurulum/gcp-deploy.sh"
