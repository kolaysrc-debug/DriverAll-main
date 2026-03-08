// DriverAll-main/drivercv-frontend/app/cv/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type Profile = {
  _id: string;
  user: string;
  role?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  city?: string;
  about?: string;
  experienceYears?: number | null;
  dynamicValues?: Record<string, any>;
};

type CvDoc = {
  _id?: string;
  userId: string;
  values: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

type FieldGroupNode = {
  key: string;
  label: string;
  level: number;
  parentKey: string | null;
  sortOrder: number;
  coverage: string[];
  requiredWith: string[];
  isDefault: boolean;
  active: boolean;
};

type FieldGroup = {
  _id: string;
  groupKey: string;
  groupLabel: string;
  description?: string;
  country?: string;
  validityModel?: string | null;
  nodes: FieldGroupNode[];

  // backend'ten geliyor, tipte de tanımlayalım
  createdAt?: string;
  updatedAt?: string;
};

function sortNodes(nodes: FieldGroupNode[]): FieldGroupNode[] {
  return [...nodes].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label, "tr");
  });
}

// Güvenli tarih -> timestamp yardımcı fonksiyonu
function toTime(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export default function CvPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [cv, setCv] = useState<CvDoc | null>(null);
  const [groups, setGroups] = useState<FieldGroup[]>([]);

  // Profil form alanları
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [about, setAbout] = useState("");
  const [experienceYears, setExperienceYears] = useState<string>("");

  // CV içindeki dinamik alanlar
  const [cvValues, setCvValues] = useState<Record<string, any>>({});

  // Grup motorundan gelen EHL_TR ve SRC_TR seçimleri
  const [selectedEhlKeys, setSelectedEhlKeys] = useState<string[]>([]);
  const [selectedSrcKeys, setSelectedSrcKeys] = useState<string[]>([]);

  // ------------------------------------------------------
  // İlk yükleme: profil + cv + grup motoru
  // ------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (typeof window === "undefined") return;

        const token = window.localStorage.getItem("token");
        if (!token) {
          setError("Oturum bulunamadı. Lütfen yeniden giriş yapın.");
          setLoading(false);
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [profileRes, cvRes, groupsRes] = await Promise.all([
          fetch("/api/profile/me", { headers }),
          fetch("/api/cv", { headers }),
          fetch("/api/admin/field-groups", { headers }),
        ]);

        if (!profileRes.ok) {
          const msg = `Profil alınamadı (status: ${profileRes.status}).`;
          throw new Error(msg);
        }
        if (!cvRes.ok) {
          const msg = `CV alınamadı (status: ${cvRes.status}).`;
          throw new Error(msg);
        }
        if (!groupsRes.ok) {
          const msg = `Grup bilgileri alınamadı (status: ${groupsRes.status}).`;
          throw new Error(msg);
        }

        const profileJson = await profileRes.json();
        const cvJson = await cvRes.json();
        const groupsJson = await groupsRes.json();

        const prof: Profile = profileJson.profile;
        const cvDoc: CvDoc =
          cvJson.cv ||
          ({
            userId: prof.user,
            values: {},
          } as CvDoc);

        const allGroups: FieldGroup[] = groupsJson.groups || [];

        setProfile(prof);
        setCv(cvDoc);
        setGroups(allGroups);

        // Profil formunu doldur
        setFullName(prof.fullName || "");
        setPhone(prof.phone || "");
        setCountry(prof.country || "");
        setCity(prof.city || "");
        setAbout(prof.about || "");
        setExperienceYears(
          prof.experienceYears !== null && prof.experienceYears !== undefined
            ? String(prof.experienceYears)
            : ""
        );

        // CV değerlerini al
        const values = cvDoc.values || {};
        setCvValues(values);

        // Grup değerlerini CV’den doldur
        const ehlFromCv = values.EHL_TR;
        const srcFromCv = values.SRC_TR;

        setSelectedEhlKeys(Array.isArray(ehlFromCv) ? ehlFromCv.map(String) : []);
        setSelectedSrcKeys(Array.isArray(srcFromCv) ? srcFromCv.map(String) : []);
      } catch (err: any) {
        console.error("CV sayfası yükleme hatası:", err);
        setError(err?.message || "Veriler alınırken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ------------------------------------------------------
  // Checkbox toggle yardımcıları
  // ------------------------------------------------------
  const toggleEhl = (key: string) => {
    setSelectedEhlKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSrc = (key: string) => {
    setSelectedSrcKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ------------------------------------------------------
  // Kaydet
  // ------------------------------------------------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("token");
    if (!token) {
      setError("Oturum bulunamadı. Lütfen yeniden giriş yapın.");
      return;
    }

    try {
      setSaving(true);

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1) Profil güncelle
      if (profile) {
        const profilePayload = {
          role: profile.role || "driver",
          fullName: fullName.trim(),
          phone: phone.trim(),
          country: country.trim(),
          city: city.trim(),
          about: about.trim(),
          experienceYears: experienceYears ? Number(experienceYears) : null,
          dynamicValues: profile.dynamicValues || {},
        };

        const profRes = await fetch("/api/profile/me", {
          method: "PUT",
          headers,
          body: JSON.stringify(profilePayload),
        });

        if (!profRes.ok) {
          let msg = "Profil kaydedilirken hata oluştu.";
          try {
            const data = await profRes.json();
            if (data?.message) msg = data.message;
          } catch {
            // body yoksa sorun değil
          }
          throw new Error(msg);
        }
      }

      // 2) CV güncelle
      const newValues: Record<string, any> = {
        ...(cvValues || {}),
        EHL_TR: selectedEhlKeys,
        SRC_TR: selectedSrcKeys,
      };

      const cvRes = await fetch("/api/cv", {
        method: "PUT",
        headers,
        body: JSON.stringify({ values: newValues }),
      });

      if (!cvRes.ok) {
        let msg = "CV kaydedilirken hata oluştu.";
        try {
          const data = await cvRes.json();
          if (data?.message) msg = data.message;
        } catch {
          // body yoksa sorun değil
        }
        throw new Error(msg);
      }

      const cvJson = await cvRes.json();
      setCv(cvJson.cv);
      setCvValues(newValues);

      setSuccess("CV ve profil bilgilerin başarıyla kaydedildi.");
    } catch (err: any) {
      console.error("CV kaydetme hatası:", err);
      setError(err?.message || "CV / profil kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------
  // Grup motorundan EHL_TR ve SRC_TR gruplarını çıkar
  // ------------------------------------------------------
  const ehlGroup = groups.find((g) => g.groupKey === "EHL_TR");
  const srcGroup = groups.find((g) => g.groupKey === "SRC_TR");

  const ehlNodes = ehlGroup ? sortNodes(ehlGroup.nodes || []) : [];
  const srcNodes = srcGroup ? sortNodes(srcGroup.nodes || []) : [];

  // ------------------------------------------------------
  // Yeni kriter / değişiklik var mı? (Uyarı bandı için)
  // ------------------------------------------------------
  const latestGroupsUpdatedAt = (() => {
    const relevant: FieldGroup[] = [];
    if (ehlGroup) relevant.push(ehlGroup);
    if (srcGroup) relevant.push(srcGroup);

    let max = 0;
    for (const g of relevant) {
      const t = toTime(g.updatedAt);
      if (t > max) max = t;
    }
    return max;
  })();

  const cvUpdatedAt = cv ? toTime(cv.updatedAt) : 0;

  // Eğer grup motoru, CV'nin son kaydından sonra güncellenmişse,
  // sürücüye "CV'ni güncelle, yeni alanlar var" mesajı gösterelim.
  const hasNewCriteria = latestGroupsUpdatedAt > cvUpdatedAt;

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold mb-1">
            Sürücü CV &amp; Profil Bilgileri
          </h1>
          <p className="text-slate-400 text-sm">
            Burada hem temel profil bilgilerini hem de ehliyet / SRC / ADR gibi
            belgelerini tek ekranda yönetebilirsin. Tüm seçimler, ilan
            filtreleri ve eşleştirme motoru tarafından kullanılacak.
          </p>
        </header>

        {hasNewCriteria && (
          <div className="rounded-lg border border-amber-500 bg-amber-900/40 px-3 py-2 text-xs md:text-sm text-amber-100">
            <div className="font-semibold text-sm">
              CV&apos;nizi güncelleyerek kalite puanınızı artırın
            </div>
            <p className="mt-1">
              Sistemimizde ehliyet / SRC / ADR seçeneklerinde güncelleme
              yapıldı. Aşağıdaki listeleri kontrol edip size uygun yeni
              belgeleri işaretlerseniz, ilan veren firmalar sizi daha kolay
              bulur.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-700 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-6 text-sm text-slate-300">
            Veriler yükleniyor...
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="space-y-6"
            autoComplete="off"
          >
            {/* PROFİL BLOĞU */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Temel Profil Bilgileri
                  </h2>
                  <p className="text-xs text-slate-400">
                    Bu alanlar profil sayfanda da kullanılacak. İletişim ve
                    genel görünür bilgiler.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Ad Soyad</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Telefon</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Ülke</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Şehir</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Sektörde toplam tecrübe (yıl)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-slate-300">
                    Kendini kısaca anlat (profil özeti)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* EHLIYET BLOĞU */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Ehliyet Sınıfları (TR)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Grup motorunda tanımlanan EHL_TR ağacındaki sınıflar burada
                    listelenir. Seçtiğin sınıflar CV’ne kaydedilir.
                  </p>
                </div>
                {!ehlGroup && (
                  <span className="text-[11px] text-amber-300">
                    Uyarı: EHL_TR grubu tanımlı değil.
                  </span>
                )}
              </div>

              {ehlNodes.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Şu anda bu grup için tanımlı node yok. Admin panelinden
                  EHL_TR için node ekleyebilirsin.
                </p>
              ) : (
                <div className="grid md:grid-cols-3 gap-2">
                  {ehlNodes.map((node) => (
                    <label
                      key={node.key}
                      className="flex items-center gap-2 text-sm text-slate-200 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 cursor-pointer hover:border-sky-500"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selectedEhlKeys.includes(node.key)}
                        onChange={() => toggleEhl(node.key)}
                      />
                      <span>
                        <span className="font-medium">{node.label}</span>
                        {node.level > 0 && (
                          <span className="ml-1 text-[11px] text-slate-400">
                            (alt seviye)
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* SRC / ADR BLOĞU */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    SRC / ADR Belgeleri (TR)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Grup motorunda tanımlanan SRC_TR ağacındaki belgeler burada
                    listelenir. Seçtiğin belgeler CV’ne kaydedilir. İleride
                    geçerlilik süreleri ve kapsama kuralları buradan
                    beslenecek.
                  </p>
                </div>
                {!srcGroup && (
                  <span className="text-[11px] text-amber-300">
                    Uyarı: SRC_TR grubu tanımlı değil.
                  </span>
                )}
              </div>

              {srcNodes.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Şu anda bu grup için tanımlı node yok. Admin panelinden
                  SRC_TR için node ekleyebilirsin.
                </p>
              ) : (
                <div className="grid md:grid-cols-3 gap-2">
                  {srcNodes.map((node) => (
                    <label
                      key={node.key}
                      className="flex items-center gap-2 text-sm text-slate-200 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 cursor-pointer hover:border-sky-500"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selectedSrcKeys.includes(node.key)}
                        onChange={() => toggleSrc(node.key)}
                      />
                      <span>
                        <span className="font-medium">{node.label}</span>
                        {node.level > 0 && (
                          <span className="ml-1 text-[11px] text-slate-400">
                            (alt seviye)
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* KAYDET BUTONU */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Kaydediliyor..." : "CV’yi Kaydet"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
