#!/usr/bin/env bash
# Ubuntu 22.04 VM üzerinde Docker kurar (Google Cloud veya başka VPS).
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Bu betik root ile çalıştırılmalı: sudo bash kurulum/gcp-vm-setup.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable docker
systemctl start docker

docker compose version

ufw --force reset || true
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 8080/tcp comment 'DriverAll test'
ufw --force enable
ufw status

echo ""
echo "Docker hazır. Sıradaki adım (proje kökünde, normal kullanıcı):"
echo "  bash kurulum/gcp-deploy.sh"
