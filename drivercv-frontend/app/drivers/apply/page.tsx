"use client";

import React, { useMemo, useState } from "react";

// ------------------------------------------------------
// Tipler
// ------------------------------------------------------

type CriteriaItem = {
  groupKey: string;
  fieldKey: string;
  label: string;
  description?: string;
};

type CriteriaGroup = {
  key: string;
  label: string;
  items: CriteriaItem[];
};

type SelectedCriteria = CriteriaItem & {
  mode: "must" | "nice"; // zorunlu / tercihen
};

type JobDraft = {
  title: string;
  country: string;
  city: string;
  employmentType: string;
  description: string;
  criteria: SelectedCriteria[];
};

// ------------------------------------------------------
// ŞİMDİLİK ÖRNEK KRİTER GRUPLARI
// (İleride bunları backend'deki FieldGroup + FieldDefinition'dan dolduracağız.)
// ------------------------------------------------------

const MOCK_GROUPS: CriteriaGroup[] = [
  {
    key: "LICENSE",
    label: "Ehliyet / Sınıf",
    items: [
      { groupKey: "LICENSE", fieldKey: "B", label: "B Sınıfı" },
      { groupKey: "LICENSE", fieldKey: "C", label: "C Sınıfı" },
      { groupKey: "LICENSE", fieldKey: "CE", label: "CE (Tır)" },
      { groupKey: "LICENSE", fieldKey: "D", label: "D (Otobüs)" },
    ],
  },
  {
    key: "SRC",
    label: "SRC Belgeleri",
    items: [
      { groupKey: "SRC", fieldKey: "SRC1", label: "SRC 1" },
      { groupKey: "SRC", fieldKey: "SRC2", label: "SRC 2" },
      { groupKey: "SRC", fieldKey: "SRC3", label: "SRC 3" },
      { groupKey: "SRC", fieldKey: "SRC4", label: "SRC 4" },
      { groupKey: "SRC", fieldKey: "SRC5", label: "SRC 5 (Tehlikeli Madde)" },
    ],
  },
  {
    key: "ADR",
    label: "ADR / Tehlikeli Madde",
    items: [
      { groupKey: "ADR", fieldKey: "ADR-BASIC", label: "ADR Temel" },
      {
        groupKey: "ADR",
        fieldKey: "ADR-TANK",
        label: "ADR Tank",
        description: "Basınçlı / tanker tecrübesi",
      },
    ],
  },
  {
    key: "LANG",
    label: "Yabancı Dil",
    items: [
      { groupKey: "LANG", fieldKey: "DE-B1", label: "Almanca (B1+)" },
      { groupKey: "LANG", fieldKey: "EN-B1", label: "İngilizce (B1+)" },
      { groupKey: "LANG", fieldKey: "NL-A2", label: "Felemenkçe (A2+)" },
    ],
  },
];

// ------------------------------------------------------
// Komponent
// ------------------------------------------------------

export default function JobCreatePage() {
  const [activeGroupKey, setActiveGroupKey] = useState<string>("LICENSE");

  const [draft, setDraft] = useState<JobDraft>({
    title: "",
    country: "",
    city: "",
    employmentType: "",
    description: "",
    criteria: [],
  });

  const activeGroup = useMemo(
    () => MOCK_GROUPS.find((g) => g.key === activeGroupKey) || MOCK_GROUPS[0],
    [activeGroupKey]
  );

  function toggleCriteria(item: CriteriaItem) {
    setDraft((prev) => {
      const existing = prev.criteria.find(
        (c) => c.groupKey === item.groupKey && c.fieldKey === item.fieldKey
      );
      if (existing) {
        // Varsa listeden çıkar
        return {
          ...prev,
          criteria: prev.criteria.filter(
            (c) =>
              !(
                c.groupKey === item.groupKey && c.fieldKey === item.fieldKey
              )
          ),
        };
      }
      // Yoksa zorunlu (must) olarak ekle
      return {
        ...prev,
        criteria: [...prev.criteria, { ...item, mode: "must" as const }],
      };
    });
  }

  function toggleMode(item: SelectedCriteria) {
    setDraft((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => {
        if (c.groupKey === item.groupKey && c.fieldKey === item.fieldKey) {
          return { ...c, mode: c.mode === "must" ? "nice" : "must" };
        }
        return c;
      }),
    }));
  }

  function removeCriteria(item: SelectedCriteria) {
    setDraft((prev) => ({
      ...prev,
      criteria: prev.criteria.filter(
        (c) =>
          !(c.groupKey === item.groupKey && c.fieldKey === item.fieldKey)
      ),
    }));
  }

  function handleDraftChange(field: keyof JobDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();

    // Şimdilik sadece konsola yazıyoruz.
    console.log("JOB DRAFT PAYLOAD", draft);

    alert(
      "Bu sayfa şu anda tasarım / prototip aşamasında.\n\n" +
        "İlan taslağı JSON olarak tarayıcı konsoluna yazdırıldı.\n" +
        "Backend API tasarımı netleştiğinde bu veri veritabanına kaydedilecek."
    );
  }

  const mustCriteria = draft.criteria.filter((c) => c.mode === "must");
  const niceCriteria = draft.criteria.filter((c) => c.mode === "nice");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Başlık */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              Yeni İlan Oluştur (İşveren / Firma)
            </h1>
            <p className="text-slate-400 text-sm">
              Bu ekran, herhangi bir şirkete özel değil; DriverAll platformunda
              sürücü arayan tüm işverenler için tasarlanmış genel ilan motorudur.
              İlan, aslında bir <strong>filtre seti</strong>dir:
              sürücüler kendilerini kriterlerle ifade eder, sen de aynı
              kriterleri işaretleyerek aradığın profili tarif edersin.
            </p>
          </div>
        </header>

        {/* 3 kolonlu layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sol: İlan temel bilgileri */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">
              1. İlan Başlığı ve Temel Bilgiler
            </h2>
            <p className="text-xs text-slate-400">
              Bu alanlar isteğe bağlıdır. Hiç yazı girmeden sadece kriter
              seçerek de ilan oluşturabilirsiniz. Yazdığınız bilgiler ilan
              sayfasında sürücülerin göreceği açıklama olarak kullanılacaktır.
            </p>

            <div className="space-y-2 mt-2">
              <input
                type="text"
                value={draft.title}
                onChange={(e) => handleDraftChange("title", e.target.value)}
                placeholder="Pozisyon adı (örn. Tır Şoförü – ADR'li, Uzun Yol vb.)"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={draft.country}
                  onChange={(e) => handleDraftChange("country", e.target.value)}
                  placeholder="Ülke (örn. Almanya)"
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                />
                <input
                  type="text"
                  value={draft.city}
                  onChange={(e) => handleDraftChange("city", e.target.value)}
                  placeholder="Şehir / Bölge (örn. Köln, NRW)"
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
                />
              </div>
              <input
                type="text"
                value={draft.employmentType}
                onChange={(e) =>
                  handleDraftChange("employmentType", e.target.value)
                }
                placeholder="Çalışma tipi (örn. Tam zamanlı, Sezonluk, 2+1 vb.)"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none"
              />
              <textarea
                rows={4}
                value={draft.description}
                onChange={(e) =>
                  handleDraftChange("description", e.target.value)
                }
                placeholder="İsteğe bağlı açıklama: firma, araçlar, rota, sunulan imkanlar..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none"
              />
            </div>
          </section>

          {/* Orta: Kriter kataloğu */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">
              2. Aradığınız Sürücü Profili (Kriter Kataloğu)
            </h2>
            <p className="text-xs text-slate-400">
              Sol taraftan bir kriter grubu seçin, aşağıdaki seçeneklere
              tıklayarak ilana ekleyin. Bir kriteri ikinci kez tıklarsanız
              listeden kaldırılır.
            </p>

            <div className="flex flex-wrap gap-2 mt-2">
              {MOCK_GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setActiveGroupKey(g.key)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${
                    activeGroupKey === g.key
                      ? "bg-sky-700/60 border-sky-400 text-sky-50"
                      : "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-400">
                Seçili grup:{" "}
                <span className="font-semibold text-slate-100">
                  {activeGroup.label}
                </span>
              </p>

              <div className="flex flex-wrap gap-2">
                {activeGroup.items.map((item) => {
                  const isSelected = draft.criteria.some(
                    (c) =>
                      c.groupKey === item.groupKey &&
                      c.fieldKey === item.fieldKey
                  );
                  return (
                    <button
                      key={item.fieldKey}
                      type="button"
                      onClick={() => toggleCriteria(item)}
                      className={`px-3 py-1.5 text-xs rounded-full border inline-flex items-center gap-1 ${
                        isSelected
                          ? "bg-emerald-600/25 border-emerald-400 text-emerald-100"
                          : "bg-slate-950 border-slate-700 text-slate-100 hover:bg-slate-800"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-[10px] text-slate-400">
                          • {item.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Sağ: Seçilen kriterler / zorunlu-tercihen */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">
              3. İlan Filtreleri (Zorunlu / Tercihen)
            </h2>
            <p className="text-xs text-slate-400">
              Burada seçtiğiniz kriterler, ilan için kullanılacak filtre setini
              oluşturur. Sürücünün CV&apos;sinde bu kriterler varsa ilanla
              eşleşir. İsterseniz hepsini zorunlu bırakabilir veya bazılarını
              &quot;tercihen&quot; olarak işaretleyebilirsiniz.
            </p>

            <div className="space-y-2 mt-2">
              <div className="text-xs text-slate-300 font-semibold">
                Zorunlu kriterler
              </div>
              {mustCriteria.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Henüz zorunlu kriter seçmediniz. En az 1–2 tane seçmeniz
                  önerilir (örn. Ehliyet, temel SRC, ADR vb.).
                </p>
              ) : (
                <ul className="space-y-1">
                  {mustCriteria.map((c) => (
                    <li
                      key={`${c.groupKey}-${c.fieldKey}`}
                      className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <span>
                        <span className="font-semibold">{c.label}</span>
                        <span className="text-slate-500">
                          {" "}
                          ({c.groupKey})
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleMode(c)}
                          className="px-2 py-0.5 rounded border border-amber-500 text-amber-300 hover:bg-amber-900/40"
                        >
                          Tercihen yap
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCriteria(c)}
                          className="px-2 py-0.5 rounded border border-rose-500 text-rose-300 hover:bg-rose-900/40"
                        >
                          Sil
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-xs text-slate-300 font-semibold mt-3">
                Tercihen kriterler
              </div>
              {niceCriteria.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Tercihen kriter seçmediniz. Örn. yabancı dil veya ekstra
                  belgeleri burada tutabilirsiniz.
                </p>
              ) : (
                <ul className="space-y-1">
                  {niceCriteria.map((c) => (
                    <li
                      key={`${c.groupKey}-${c.fieldKey}`}
                      className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <span>
                        <span className="font-semibold">{c.label}</span>
                        <span className="text-slate-500">
                          {" "}
                          ({c.groupKey})
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleMode(c)}
                          className="px-2 py-0.5 rounded border border-emerald-500 text-emerald-300 hover:bg-emerald-900/40"
                        >
                          Zorunlu yap
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCriteria(c)}
                          className="px-2 py-0.5 rounded border border-rose-500 text-rose-300 hover:bg-rose-900/40"
                        >
                          Sil
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleSaveDraft} className="mt-3 space-y-2">
              <button
                type="submit"
                className="w-full px-4 py-2 text-xs rounded-lg bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400"
              >
                İlan taslağını kaydet (şimdilik konsola yaz)
              </button>

              <p className="text-[11px] text-slate-500">
                Bu buton şu anda geliştirme / test amaçlıdır. Tıkladığınızda
                ilan taslağı JSON olarak <strong>tarayıcı konsoluna</strong>{" "}
                yazılır. Backend API tasarımı netleştiğinde bu veri gerçek
                olarak veritabanına kaydedilecektir.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
