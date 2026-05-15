# DriverAll — Google Cloud / VDS Deploy Rehberi (detaylı)

Hızlı yol için önce [BASIT-KURULUM.md](./BASIT-KURULUM.md) ve betikler: `gcp-vm-setup.sh`, `gcp-deploy.sh`.

## Gereksinimler

- **VDS**: Ubuntu 22.04+ (min 2 vCPU, 4GB RAM)
- **Docker**: 24+
- **Docker Compose**: v2+
- **Domain** (opsiyonel): DNS A kaydı VDS IP'sine yönlendirilmiş

---

## Otomatik kurulum (önerilen)

```bash
cd /opt/driverall   # veya ~/driverall
sudo bash kurulum/gcp-vm-setup.sh
bash kurulum/gcp-deploy.sh
```

---

## Manuel kurulum

### 1. VDS'e Bağlan ve Docker Kur

```bash
ssh KULLANICI@YOUR_VDS_IP
sudo bash kurulum/gcp-vm-setup.sh
```

### 2. Proje Dosyalarını VDS'e Kopyala

```powershell
# Windows:
.\kurulum\upload-to-gcp.ps1 -VmIp "YOUR_VDS_IP" -User "KULLANICI"
```

```bash
# Git:
git clone YOUR_REPO_URL driverall && cd driverall
```

### 3. Backend .env

Şablon: `drivercv-backend/.env.example`  
Otomatik üretim: `bash kurulum/gcp-deploy.sh`

### 4. Docker Compose

**Test (SSL yok, port 8080):**

```bash
docker compose -f docker-compose.local.yml up -d --build
```

**Production (domain + SSL):**

```bash
export MONGO_USER=driver
export MONGO_PASS=GUCLU_MONGO_SIFRESI
docker compose -f docker-compose.production.yml up -d --build
```

### 5. Admin Kullanıcı

```bash
docker exec -it driverall-backend-local sh -c "\
  DEFAULT_ADMIN_EMAIL=admin@yourdomain.com \
  DEFAULT_ADMIN_PASSWORD=GucluSifre123! \
  NODE_ENV=production \
  node scripts/seedAdmin.js"
```

(Production container adı: `driverall-backend`)

### 6. SSL (Let's Encrypt)

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d YOUR_DOMAIN
sudo cp /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem nginx/certs/
docker compose -f docker-compose.production.yml restart nginx
```

### 7. Health Check

```bash
curl http://127.0.0.1:8080/api/health          # local test
curl http://localhost/api/health               # production nginx
```

---

## Güncelleme

```bash
cd ~/driverall
git pull
docker compose -f docker-compose.local.yml up -d --build
# veya production compose
```

## Yedekleme (MongoDB)

```bash
docker exec driverall-mongo-local mongodump \
  --username=driver --password=MONGO_PASS \
  --authenticationDatabase=admin \
  --db=driverall --out=/tmp/backup
```

---

## Dosya yapısı

```
DriverAll-main/
├── kurulum/                        ← Bu klasör
├── docker-compose.local.yml
├── docker-compose.production.yml
├── nginx/
├── drivercv-backend/
└── drivercv-frontend/
```
