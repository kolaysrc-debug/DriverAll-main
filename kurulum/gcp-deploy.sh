#!/usr/bin/env bash
# Proje kökünden: bash kurulum/gcp-deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
KURULUM="$(cd "$(dirname "$0")" && pwd)"

COMPOSE_FILE="docker-compose.local.yml"
ENV_FILE="$ROOT/drivercv-backend/.env"

if [ -z "${VM_PUBLIC_IP:-}" ]; then
  VM_PUBLIC_IP="$(curl -fsS -H "Metadata-Flavor: Google" \
    http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || true)"
fi
if [ -z "${VM_PUBLIC_IP:-}" ]; then
  VM_PUBLIC_IP="$(curl -fsS ifconfig.me 2>/dev/null || echo "SUNUCU_IP_BURAYA")"
fi

gen_secret() {
  openssl rand -hex 24 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32
}

MONGO_USER="${MONGO_USER:-driver}"
MONGO_PASS="${MONGO_PASS:-$(gen_secret)}"
JWT_SECRET="${JWT_SECRET:-$(gen_secret)}"
OTP_KEY="${OTP_SECRETS_MASTER_KEY:-$(gen_secret)}"

ADMIN_EMAIL="${DEFAULT_ADMIN_EMAIL:-admin@driverall.local}"
ADMIN_PASSWORD="${DEFAULT_ADMIN_PASSWORD:-$(gen_secret | head -c 16)}Aa1!}"

CORS="http://${VM_PUBLIC_IP}:8080,http://127.0.0.1:8080,http://localhost:8080"
if [ -n "${PUBLIC_URL:-}" ]; then
  CORS="${CORS},${PUBLIC_URL}"
  if [[ "$PUBLIC_URL" == https://* ]]; then
    CORS="${CORS},${PUBLIC_URL/https:/http:}"
  fi
fi

mkdir -p "$ROOT/drivercv-backend"
cat > "$ENV_FILE" <<EOF
# Otomatik üretildi: kurulum/gcp-deploy.sh — $(date -Iseconds)
MONGO_URI=mongodb://${MONGO_USER}:${MONGO_PASS}@mongodb:27017/driverall?authSource=admin
PORT=3001
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=30d
CORS_ORIGINS=${CORS}
RATE_LIMIT_RPM=200
AUTH_RATE_LIMIT_RPM=15
OTP_SECRETS_MASTER_KEY=${OTP_KEY}
FRONTEND_URL=http://${VM_PUBLIC_IP}:8080
EOF
chmod 600 "$ENV_FILE"

export MONGO_USER MONGO_PASS JWT_SECRET

echo "=== Docker build & start (ilk sefer 10-20 dk sürebilir) ==="
docker compose -f "$COMPOSE_FILE" up -d --build

echo "=== Sağlık kontrolü ==="
sleep 5
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:8080/api/health" >/dev/null 2>&1; then
    echo "OK: /api/health"
    curl -sS "http://127.0.0.1:8080/api/health" | head -c 400
    echo ""
    break
  fi
  echo "Bekleniyor... ($i/10)"
  sleep 15
done

echo "=== Admin kullanıcı ==="
docker exec \
  -e DEFAULT_ADMIN_EMAIL="$ADMIN_EMAIL" \
  -e DEFAULT_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e NODE_ENV=production \
  driverall-backend-local node scripts/seedAdmin.js

CREDS_FILE="$KURULUM/deploy-credentials.txt"
cat > "$CREDS_FILE" <<EOF
DriverAll deploy — $(date)
Site: http://${VM_PUBLIC_IP}:8080
Admin e-posta: ${ADMIN_EMAIL}
Admin şifre: ${ADMIN_PASSWORD}
Mongo kullanıcı: ${MONGO_USER}
Mongo şifre: ${MONGO_PASS}
JWT_SECRET: ${JWT_SECRET}
(.env dosyası: drivercv-backend/.env)
EOF
chmod 600 "$CREDS_FILE"

echo ""
echo "=============================================="
echo "  Site: http://${VM_PUBLIC_IP}:8080"
echo "  Giriş: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
echo "  Şifreler: kurulum/deploy-credentials.txt"
echo "=============================================="
echo "GCP Firewall: TCP 8080 açık olmalı (test için)."
