# DriverAll — Sizin yapmanız gereken 5 adım (geri kalanı betik)

**Tüm kurulum dosyaları:** `kurulum/` klasörü ([README](./README.md))

Cursor / asistan kodu hazırlar; **Google hesabına sadece siz girebilirsiniz**. Aşağıdaki 5 adımı yapın, sonra sunucuda **2 komut** yeterli.

---

## Sizin yapacağınızlar (≈15–20 dk)

### 1) Yeni Google hesabı + proje
- https://console.cloud.google.com — **yeni Gmail** ile giriş
- **Yeni proje** oluştur (eski `driverall-260328` kullanmayın)
- **Faturalandırma** bağla

### 2) Sanal makine (VM)
- **Compute Engine** → **VM oluştur**
- Ubuntu 22.04, **e2-medium**, disk 30 GB
- Firewall: **HTTP + HTTPS** işaretli
- **Oluştur** → **Dış IP**’yi kopyala (ör. `34.12.34.56`)

### 3) Ek firewall (8080 test portu)
- **VPC** → **Firewall** → **Kural oluştur**
- Hedef: tüm örnekler, TCP **8080**, Kaynak: `0.0.0.0/0` (sadece test; sonra kapatabilirsiniz)

### 4) Projeyi sunucuya gönder

**A) Tarayıcıdan SSH (en kolay)**  
- VM satırında **SSH** düğmesi → açılan pencerede:

```bash
sudo apt-get update && sudo apt-get install -y git
cd ~
git clone SIZIN_GITHUB_REPO_URL driverall
cd driverall
```

**B) Windows’ta PowerShell (projeyi kopyala)**

```powershell
cd D:\CURSOR\DriverAll-main
.\kurulum\upload-to-gcp.ps1 -VmIp "34.12.34.56" -User "GCP_KULLANICI_ADINIZ"
```

### 5) Sunucuda 2 komut (SSH penceresinde)

```bash
cd ~/driverall
sudo bash kurulum/gcp-vm-setup.sh
bash kurulum/gcp-deploy.sh
```

Bittiğinde tarayıcıda: **http://DIS_IP:8080**  
Admin şifreleri: `cat ~/driverall/kurulum/deploy-credentials.txt`

---

## Eski hesap (sonra)
- Eski projede tüm **VM’leri sil** (disk dahil)
- İsterseniz maildeki **temyiz**; site yeni hesapta çalışıyorsa silmek çoğu zaman yeterli

---

## Sorun çıkarsa
- `docker compose -f docker-compose.local.yml logs -f`
- Health: `curl http://127.0.0.1:8080/api/health`

Detaylı SSL/domain kurulumu: [DEPLOY.md](./DEPLOY.md)
