import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <Link href="/" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">← Ana Sayfa</Link>

        <h1 className="text-2xl font-bold text-slate-50 mt-4 mb-6">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
        <p className="text-xs text-slate-500 mb-8">Son güncelleme: Mart 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-slate-300">

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">1. Veri Sorumlusu</h2>
            <p>
              DriverAll platformu ("Platform") üzerinden toplanan kişisel verileriniz, 6698 sayılı Kişisel Verilerin
              Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla DriverAll tarafından işlenmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">2. Toplanan Kişisel Veriler</h2>
            <p>Platform üzerinden aşağıdaki kişisel veriler toplanabilir:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Kimlik bilgileri:</strong> Ad, soyad</li>
              <li><strong>İletişim bilgileri:</strong> E-posta adresi, telefon numarası</li>
              <li><strong>Mesleki bilgiler:</strong> Ehliyet türü, sertifikalar, iş deneyimi, CV verileri</li>
              <li><strong>Konum bilgileri:</strong> İl, ilçe bilgisi</li>
              <li><strong>Hesap bilgileri:</strong> Kullanıcı rolü, kayıt tarihi, oturum bilgileri</li>
              <li><strong>İşlem bilgileri:</strong> İlan başvuruları, sipariş ve ödeme kayıtları</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">3. Verilerin İşlenme Amacı</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Üyelik kaydı ve kimlik doğrulama</li>
              <li>İş ilanı yayınlama ve başvuru süreçleri</li>
              <li>Sürücü-işveren eşleştirme hizmetleri</li>
              <li>Ödeme ve sipariş yönetimi</li>
              <li>Platform güvenliği ve dolandırıcılık önleme</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>İletişim ve bilgilendirme (e-posta bildirimleri)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">4. Verilerin Aktarılması</h2>
            <p>
              Kişisel verileriniz, yasal zorunluluklar ve hizmet gereksinimleri kapsamında; iş ortaklarına,
              ödeme hizmet sağlayıcılarına, hosting/altyapı sağlayıcılarına ve yetkili kamu kurumlarına
              aktarılabilir. Verileriniz yurt dışına aktarılması durumunda KVKK'nın 9. maddesi uyarınca
              gerekli önlemler alınır.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">5. Veri Saklama Süresi</h2>
            <p>
              Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatın öngördüğü
              zamanaşımı süreleri boyunca saklanır. Süre sona erdiğinde verileriniz silinir, yok edilir
              veya anonim hale getirilir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">6. KVKK Kapsamındaki Haklarınız</h2>
            <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme</li>
              <li>KVKK'nın 7. maddesindeki koşullar çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonuç çıkmasına itiraz etme</li>
              <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">7. Çerezler (Cookies)</h2>
            <p>
              Platform, oturum yönetimi için tarayıcınızda yerel depolama (localStorage) kullanır.
              Üçüncü taraf çerezleri, yalnızca analiz ve performans izleme amacıyla kullanılabilir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">8. İletişim</h2>
            <p>
              KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki adresten bizimle iletişime geçebilirsiniz:
            </p>
            <p className="mt-2 text-emerald-400 font-medium">info@driverall.com</p>
          </section>

        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 flex gap-4 text-xs text-slate-500">
          <Link href="/legal/terms" className="hover:text-emerald-400 transition-colors">Kullanım Koşulları</Link>
          <Link href="/" className="hover:text-emerald-400 transition-colors">Ana Sayfa</Link>
        </div>
      </div>
    </div>
  );
}
