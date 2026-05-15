# DriverAll — Kurulum klasörü

Sunucuya deploy, Google Cloud ve otomatik betikler burada toplanır. Tekrar kurulum için bu klasörü kullanın.

## Hızlı başlangıç

| Dosya | Ne için? |
|-------|----------|
| [BASIT-KURULUM.md](./BASIT-KURULUM.md) | Kod bilmeden: GCP + 5 adım + 2 komut |
| [DEPLOY.md](./DEPLOY.md) | Domain, SSL, production compose (detaylı) |
| [gcp-vm-setup.sh](./gcp-vm-setup.sh) | Sunucuda Docker + firewall (sudo) |
| [gcp-deploy.sh](./gcp-deploy.sh) | Siteyi ayağa kaldırır, admin oluşturur |
| [upload-to-gcp.ps1](./upload-to-gcp.ps1) | Windows → VM dosya kopyası |

## Sunucuda (SSH)

Proje köküne gittikten sonra (`cd ~/driverall`):

```bash
sudo bash kurulum/gcp-vm-setup.sh
bash kurulum/gcp-deploy.sh
```

Test adresi: `http://SUNUCU_DIS_IP:8080`  
Şifreler: `kurulum/deploy-credentials.txt` (otomatik oluşur, git’e girmez)

## Windows’ta kopyalama

```powershell
cd D:\CURSOR\DriverAll-main
.\kurulum\upload-to-gcp.ps1 -VmIp "34.x.x.x" -User "GCP_KULLANICI"
```

## Proje kökündeki ilgili dosyalar

- `docker-compose.local.yml` — SSL’siz hızlı test (port 8080)
- `docker-compose.production.yml` — Nginx + HTTPS
- `drivercv-backend/.env.example` — env şablonu
