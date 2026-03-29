# DriverAll — Google Cloud Engine (VDS) Deploy Rehberi

## Gereksinimler

- **VDS**: Ubuntu 22.04+ (min 2 vCPU, 4GB RAM)
- **Docker**: 24+
- **Docker Compose**: v2+
- **Domain** (opsiyonel): DNS A kaydı VDS IP'sine yönlendirilmiş

---

## 1. VDS'e Bağlan ve Docker Kur

```bash
ssh root@YOUR_VDS_IP

# Docker kurulumu
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Docker Compose (v2 plugin olarak gelir)
docker compose version
```

## 2. Proje Dosyalarını VDS'e Kopyala

```bash
# Lokalde (Windows PowerShell):
scp -r D:\WINDSURF\DriverAll-main root@YOUR_VDS_IP:/opt/driverall

# VEYA git ile:
ssh root@YOUR_VDS_IP
cd /opt
git clone YOUR_REPO_URL driverall
```

## 3. Backend .env Dosyasını Oluştur

```bash
cd /opt/driverall/drivercv-backend
nano .env
```

Aşağıdaki değerleri girin:

```bash
# MongoDB (docker-compose tarafından kullanılacak)
MONGO_URI=mongodb://driver:driverpass@mongodb:27017/driverall?authSource=admin

# JWT — EN AZ 32 karakter güçlü secret
JWT_SECRET=BURAYA_GUCLU_SECRET_YAZIN_MIN_32_KARAKTER
JWT_EXPIRES_IN=30d

# Server
PORT=3001
NODE_ENV=production

# CORS — domain'inizi ekleyin
CORS_ORIGINS=http://YOUR_DOMAIN,https://YOUR_DOMAIN

# Rate Limiting
RATE_LIMIT_RPM=200
AUTH_RATE_LIMIT_RPM=15

# OTP (Twilio) — opsiyonel
OTP_SECRETS_MASTER_KEY=BURAYA_EN_AZ_32_KARAKTER_KEY

# Google OAuth — opsiyonel
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://YOUR_DOMAIN/api/auth/google/callback

# Yandex OAuth — opsiyonel
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_CALLBACK_URL=https://YOUR_DOMAIN/api/auth/yandex/callback

FRONTEND_URL=https://YOUR_DOMAIN
```

## 4. Docker Compose ile Başlat

```bash
cd /opt/driverall

# Mongo ve backend şifresini env'den ayarla (opsiyonel, varsayılan: driver/driverpass)
export MONGO_USER=driver
export MONGO_PASS=GUCLU_MONGO_SIFRESI

# Build ve başlat
docker compose -f docker-compose.production.yml up -d --build

# Logları kontrol et
docker compose -f docker-compose.production.yml logs -f
```

## 5. Admin Kullanıcı Oluştur

```bash
docker exec -it driverall-backend sh -c "\
  DEFAULT_ADMIN_EMAIL=admin@yourdomain.com \
  DEFAULT_ADMIN_PASSWORD=GucluSifre123! \
  NODE_ENV=production \
  node scripts/seedAdmin.js"
```

## 6. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
apt install -y certbot

# Sertifika al (nginx durdurmadan)
certbot certonly --standalone -d YOUR_DOMAIN

# Sertifikaları nginx'e bağla
cp /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem /opt/driverall/nginx/certs/
cp /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem /opt/driverall/nginx/certs/
```

Sonra `nginx/nginx.conf`'a SSL bloğu ekleyin:

```nginx
server {
    listen 443 ssl;
    server_name YOUR_DOMAIN;
    
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # ... mevcut location blokları aynı kalır
}

server {
    listen 80;
    server_name YOUR_DOMAIN;
    return 301 https://$host$request_uri;
}
```

Nginx'i yeniden başlat:
```bash
docker compose -f docker-compose.production.yml restart nginx
```

## 7. Health Check

```bash
# Backend
curl http://localhost/api/health

# Frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost/
```

---

## Güncelleme (Yeni Deploy)

```bash
cd /opt/driverall
git pull origin main
docker compose -f docker-compose.production.yml up -d --build
```

## Yedekleme (MongoDB)

```bash
# Backup
docker exec driverall-mongo mongodump \
  --username=driver --password=MONGO_PASS \
  --authenticationDatabase=admin \
  --db=driverall --out=/tmp/backup

docker cp driverall-mongo:/tmp/backup ./backup_$(date +%Y%m%d)

# Restore
docker cp ./backup_YYYYMMDD driverall-mongo:/tmp/restore
docker exec driverall-mongo mongorestore \
  --username=driver --password=MONGO_PASS \
  --authenticationDatabase=admin \
  --db=driverall /tmp/restore/driverall
```

---

## Dosya Yapısı (Deploy)

```
DriverAll-main/
├── docker-compose.production.yml   ← Ana deploy dosyası
├── nginx/
│   ├── nginx.conf                  ← Reverse proxy config
│   └── certs/                      ← SSL sertifikaları
├── drivercv-backend/
│   ├── Dockerfile                  ← Backend container
│   ├── .env                        ← Production env (gitignore)
│   └── scripts/seedAdmin.js        ← Admin oluşturma
└── drivercv-frontend/
    ├── Dockerfile                  ← Frontend container (multi-stage)
    └── next.config.ts              ← standalone output
```
