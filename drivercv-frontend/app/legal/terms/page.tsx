import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <Link href="/" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">← Ana Sayfa</Link>

        <h1 className="text-2xl font-bold text-slate-50 mt-4 mb-6">Kullanım Koşulları</h1>
        <p className="text-xs text-slate-500 mb-8">Son güncelleme: Mart 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-slate-300">

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">1. Genel Hükümler</h2>
            <p>
              Bu kullanım koşulları, DriverAll platformunu ("Platform") kullanan tüm kullanıcılar
              ("Kullanıcı") için geçerlidir. Platforma kayıt olarak veya platformu kullanarak
              bu koşulları kabul etmiş sayılırsınız.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">2. Hizmet Tanımı</h2>
            <p>DriverAll, aşağıdaki hizmetleri sunar:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Sürücüler için:</strong> Profil ve CV oluşturma, iş ilanlarına başvuru, belge yönetimi</li>
              <li><strong>İşverenler için:</strong> İş ilanı yayınlama, başvuru yönetimi, aday arama ve eşleştirme, ekip yönetimi</li>
              <li><strong>Reklam verenler için:</strong> Platform üzerinde reklam yayınlama</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">3. Üyelik ve Hesap Güvenliği</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kayıt sırasında doğru ve güncel bilgiler vermekle yükümlüsünüz.</li>
              <li>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz.</li>
              <li>Hesabınızda şüpheli bir etkinlik fark ederseniz derhal bize bildirmeniz gerekir.</li>
              <li>Bir kişi yalnızca bir hesap açabilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">4. İçerik Kuralları</h2>
            <p>Platform üzerinde paylaşılan içerikler aşağıdaki kurallara tabidir:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Yanıltıcı, sahte veya aldatıcı bilgi paylaşılamaz.</li>
              <li>Başkalarının haklarını ihlal eden içerik yayınlanamaz.</li>
              <li>Yasal olmayan, ayrımcı veya taciz edici içerik yasaktır.</li>
              <li>İş ilanları gerçek ve mevcut pozisyonlara ait olmalıdır.</li>
              <li>CV ve profil bilgileri doğru olmalıdır.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">5. Ücretli Hizmetler ve Ödemeler</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Paket satın alımları sipariş oluşturma ve ödeme onay sürecine tabidir.</li>
              <li>Manuel EFT/havale ödemeleri admin onayından sonra aktifleştirilir.</li>
              <li>Satın alınan paketler, belirtilen süre ve kredi limitleri dahilinde kullanılabilir.</li>
              <li>İade koşulları, kullanılmamış krediler için geçerlidir ve münferit olarak değerlendirilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">6. Platform Kullanım Kuralları</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Platformu kötü amaçla kullanmak (spam, bot, DDoS vb.) yasaktır.</li>
              <li>Başka kullanıcıların hesaplarına yetkisiz erişim yasaktır.</li>
              <li>Platform altyapısına zarar verecek eylemler yasaktır.</li>
              <li>Otomatik veri toplama (scraping) yasaktır.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">7. Sorumluluk Sınırları</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Platform, kullanıcılar arasındaki işlemlerde aracı konumundadır.</li>
              <li>İş ilişkilerinden doğan uyuşmazlıklardan DriverAll sorumlu tutulamaz.</li>
              <li>Platform, teknik sorunlar nedeniyle oluşabilecek kesintilerden dolayı sorumluluk kabul etmez.</li>
              <li>Kullanıcıların paylaştığı bilgilerin doğruluğundan ilgili kullanıcı sorumludur.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">8. Hesap Askıya Alma ve Fesih</h2>
            <p>
              Bu koşulları ihlal eden hesaplar, önceden bildirimde bulunulmaksızın askıya alınabilir
              veya kalıcı olarak kapatılabilir. Bu durumda kullanılmamış krediler için iade politikası
              uygulanır.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">9. Fikri Mülkiyet</h2>
            <p>
              Platform tasarımı, yazılımı, logosu ve içeriği DriverAll'a aittir ve telif hakkı ile korunmaktadır.
              İzinsiz kopyalama, dağıtma veya değiştirme yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">10. Değişiklikler</h2>
            <p>
              DriverAll, bu kullanım koşullarını önceden bildirimde bulunmaksızın güncelleme hakkını
              saklı tutar. Güncellemeler yayınlandığı tarihten itibaren geçerli olur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">11. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
            <p>
              Bu koşullar Türkiye Cumhuriyeti hukuku kapsamında yorumlanır. Uyuşmazlıklarda
              İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-100 mb-2">12. İletişim</h2>
            <p>Sorularınız için:</p>
            <p className="mt-2 text-emerald-400 font-medium">info@driverall.com</p>
          </section>

        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 flex gap-4 text-xs text-slate-500">
          <Link href="/legal/privacy" className="hover:text-emerald-400 transition-colors">Gizlilik Politikası</Link>
          <Link href="/" className="hover:text-emerald-400 transition-colors">Ana Sayfa</Link>
        </div>
      </div>
    </div>
  );
}
