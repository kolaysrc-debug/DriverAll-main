"use client";

// ─── Desteklenen diller ───────────────────────────────────────────────────────
export type Lang = "tr" | "en" | "de" | "fr";

export const LANG_LABELS: Record<Lang, string> = {
  tr: "TR",
  en: "EN",
  de: "DE",
  fr: "FR",
};

export const LANG_NAMES: Record<Lang, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  fr: "Français",
};

// ─── Çeviri tablosu ───────────────────────────────────────────────────────────
const translations = {
  // Üst bar
  "nav.home":        { tr: "Ana Sayfa",    en: "Home",         de: "Startseite",   fr: "Accueil" },
  "nav.jobs":        { tr: "İlanlar",      en: "Jobs",         de: "Stellen",      fr: "Offres" },
  "nav.dashboard":   { tr: "Dashboard",   en: "Dashboard",    de: "Dashboard",    fr: "Tableau de bord" },
  "nav.profile":     { tr: "Profili düzenle", en: "Edit profile", de: "Profil bearbeiten", fr: "Modifier le profil" },
  "nav.login":       { tr: "Giriş / Kayıt", en: "Login / Register", de: "Anmelden / Registrieren", fr: "Connexion / S'inscrire" },
  "nav.logout":      { tr: "Çıkış",       en: "Logout",       de: "Abmelden",     fr: "Déconnexion" },
  "nav.quickmenu":   { tr: "Hızlı Menü",  en: "Quick Menu",   de: "Schnellmenü",  fr: "Menu rapide" },

  // Auth modal
  "auth.title":      { tr: "Giriş / Kayıt", en: "Login / Register", de: "Anmelden / Registrieren", fr: "Connexion / S'inscrire" },
  "auth.close":      { tr: "Kapat",       en: "Close",        de: "Schließen",    fr: "Fermer" },
  "auth.login":      { tr: "Giriş",       en: "Login",        de: "Anmelden",     fr: "Connexion" },
  "auth.register":   { tr: "Kayıt",       en: "Register",     de: "Registrieren", fr: "S'inscrire" },
  "auth.name":       { tr: "Ad Soyad",    en: "Full Name",    de: "Vor- und Nachname", fr: "Nom complet" },
  "auth.phone":      { tr: "Telefon",     en: "Phone",        de: "Telefon",      fr: "Téléphone" },
  "auth.role":       { tr: "Rol",         en: "Role",         de: "Rolle",        fr: "Rôle" },
  "auth.email":      { tr: "E-posta",     en: "Email",        de: "E-Mail",       fr: "E-mail" },
  "auth.password":   { tr: "Şifre",       en: "Password",     de: "Passwort",     fr: "Mot de passe" },
  "auth.submit.login":    { tr: "Giriş Yap",  en: "Sign In",  de: "Einloggen",    fr: "Se connecter" },
  "auth.submit.register": { tr: "Kayıt Ol",   en: "Sign Up",  de: "Registrieren", fr: "S'inscrire" },
  "auth.busy":       { tr: "İşleniyor...", en: "Processing...", de: "Verarbeitung...", fr: "Traitement..." },
  "auth.role.driver":     { tr: "Aday",      en: "Driver",    de: "Fahrer",       fr: "Conducteur" },
  "auth.role.employer":   { tr: "İşveren",   en: "Employer",  de: "Arbeitgeber",  fr: "Employeur" },
  "auth.role.advertiser": { tr: "Reklamveren", en: "Advertiser", de: "Werbetreibender", fr: "Annonceur" },

  // Hero
  "hero.badge":      { tr: "Profesyonel Sürücü Platformu", en: "Professional Driver Platform", de: "Professionelle Fahrer-Plattform", fr: "Plateforme Professionnelle de Chauffeurs" },
  "hero.title1":     { tr: "Sürücü işi bul,", en: "Find a driver job,", de: "Fahrerjob finden,", fr: "Trouver un emploi," },
  "hero.title2":     { tr: "veya doğru adayı işe al.", en: "or hire the right candidate.", de: "oder den richtigen Kandidaten einstellen.", fr: "ou recruter le bon candidat." },
  "hero.subtitle":   { tr: "SRC · ADR · TIR · Kamyon · Forklift — kriter motoru ile eşleşen ilanlar ve net başvuru akışı.", en: "SRC · ADR · TIR · Truck · Forklift — smart matching and clear application flow.", de: "SRC · ADR · TIR · LKW · Gabelstapler — intelligentes Matching und klarer Bewerbungsablauf.", fr: "SRC · ADR · TIR · Camion · Chariot — correspondance intelligente et flux de candidature clair." },

  // Arama kutusu
  "search.keyword":  { tr: "Anahtar kelime", en: "Keyword",  de: "Stichwort",    fr: "Mot-clé" },
  "search.keyword.placeholder": { tr: "SRC, ADR, TIR, Kamyon...", en: "SRC, ADR, TIR, Truck...", de: "SRC, ADR, TIR, LKW...", fr: "SRC, ADR, TIR, Camion..." },
  "search.city":     { tr: "İl",            en: "City",       de: "Stadt",        fr: "Ville" },
  "search.city.placeholder": { tr: "İl seç", en: "Select city", de: "Stadt wählen", fr: "Choisir une ville" },
  "search.type":     { tr: "Aday tipi",     en: "Candidate type", de: "Kandidatentyp", fr: "Type de candidat" },
  "search.all":      { tr: "Tümü",          en: "All",        de: "Alle",         fr: "Tous" },
  "search.btn":      { tr: "Ara",           en: "Search",     de: "Suchen",       fr: "Rechercher" },
  "search.popular":  { tr: "Popüler:",      en: "Popular:",   de: "Beliebt:",     fr: "Populaire :" },

  // Kategoriler
  "cat.title":       { tr: "Kategorilere Göre Ara", en: "Browse by Category", de: "Nach Kategorie suchen", fr: "Parcourir par catégorie" },
  "cat.subtitle":    { tr: "İş tipine göre filtrele", en: "Filter by job type", de: "Nach Jobtyp filtern", fr: "Filtrer par type d'emploi" },
  "cat.truck":       { tr: "TIR / Kamyon",  en: "TIR / Truck", de: "TIR / LKW",  fr: "TIR / Camion" },
  "cat.src":         { tr: "SRC Belgeli",   en: "SRC Certified", de: "SRC-zertifiziert", fr: "Certifié SRC" },
  "cat.adr":         { tr: "ADR Belgeli",   en: "ADR Certified", de: "ADR-zertifiziert", fr: "Certifié ADR" },
  "cat.forklift":    { tr: "Forklift",      en: "Forklift",   de: "Gabelstapler", fr: "Chariot élévateur" },
  "cat.courier":     { tr: "Kurye",         en: "Courier",    de: "Kurier",       fr: "Coursier" },
  "cat.service":     { tr: "Servis",        en: "Service",    de: "Service",      fr: "Service" },
  "cat.logistics":   { tr: "Lojistik",      en: "Logistics",  de: "Logistik",     fr: "Logistique" },
  "cat.international": { tr: "Uluslararası", en: "International", de: "International", fr: "International" },
  "cat.worktype":    { tr: "Çalışma Tipi:", en: "Work Type:", de: "Arbeitstyp:",  fr: "Type de travail :" },
  "cat.fulltime":    { tr: "Tam Zamanlı",   en: "Full Time",  de: "Vollzeit",     fr: "Temps plein" },
  "cat.parttime":    { tr: "Part-Time",     en: "Part-Time",  de: "Teilzeit",     fr: "Temps partiel" },
  "cat.remote":      { tr: "Uzaktan",       en: "Remote",     de: "Remote",       fr: "Télétravail" },
  "cat.graduate":    { tr: "Yeni Mezun",    en: "Fresh Graduate", de: "Berufseinsteiger", fr: "Jeune diplômé" },

  // Lokasyon
  "loc.title":       { tr: "Lokasyona Göre İlanlar", en: "Jobs by Location", de: "Stellen nach Standort", fr: "Offres par localisation" },
  "loc.count":       { tr: "ilan",          en: "jobs",       de: "Stellen",      fr: "offres" },

  // Nasıl çalışır
  "how.title":       { tr: "Nasıl Çalışır?", en: "How It Works", de: "Wie es funktioniert", fr: "Comment ça marche" },
  "how.subtitle":    { tr: "Üç adımda doğru işe veya doğru adaya ulaş.", en: "Reach the right job or candidate in three steps.", de: "In drei Schritten zum richtigen Job oder Kandidaten.", fr: "Accédez au bon emploi ou candidat en trois étapes." },
  "how.step1.title": { tr: "Profil Oluştur", en: "Create Profile", de: "Profil erstellen", fr: "Créer un profil" },
  "how.step1.desc":  { tr: "Konum, ehliyet, SRC, ADR gibi kriterlerini doldur ve CV'ni oluştur.", en: "Fill in your location, license, SRC, ADR criteria and create your CV.", de: "Fülle Standort, Führerschein, SRC, ADR-Kriterien aus und erstelle deinen Lebenslauf.", fr: "Remplissez vos critères de localisation, permis, SRC, ADR et créez votre CV." },
  "how.step2.title": { tr: "Filtrele & Keşfet", en: "Filter & Discover", de: "Filtern & Entdecken", fr: "Filtrer & Découvrir" },
  "how.step2.desc":  { tr: "İl, kriter ve aday tipi filtrelerini kullanarak sana uygun ilanları bul.", en: "Use city, criteria and candidate type filters to find suitable listings.", de: "Nutze Stadt-, Kriterien- und Kandidatentyp-Filter, um passende Stellen zu finden.", fr: "Utilisez les filtres de ville, critères et type de candidat pour trouver des offres." },
  "how.step3.title": { tr: "Başvur & Takip Et", en: "Apply & Track", de: "Bewerben & Verfolgen", fr: "Postuler & Suivre" },
  "how.step3.desc":  { tr: "Tek tıkla başvur, süreci panelden canlı takip et.", en: "Apply with one click and track the process live from the panel.", de: "Mit einem Klick bewerben und den Prozess live im Panel verfolgen.", fr: "Postulez en un clic et suivez le processus en direct depuis le panel." },

  // CTA
  "cta.employer.title": { tr: "İşverenler İçin",   en: "For Employers",   de: "Für Arbeitgeber",   fr: "Pour les employeurs" },
  "cta.employer.desc":  { tr: "Kriter motoruyla aday eşleşmesi, tek panelden başvuru yönetimi, ilan paketleri ve görüşme takibi.", en: "Candidate matching with criteria engine, application management, job packages and interview tracking.", de: "Kandidaten-Matching mit Kriterien-Engine, Bewerbungsmanagement, Stellenpakete und Interview-Tracking.", fr: "Correspondance de candidats, gestion des candidatures, packages d'offres et suivi des entretiens." },
  "cta.employer.post":  { tr: "İlan Oluştur",   en: "Post a Job",    de: "Stelle ausschreiben", fr: "Publier une offre" },
  "cta.employer.pkg":   { tr: "Paket ile Yayınla", en: "Publish with Package", de: "Mit Paket veröffentlichen", fr: "Publier avec forfait" },
  "cta.employer.see":   { tr: "Paketleri Gör", en: "See Packages",  de: "Pakete ansehen",  fr: "Voir les forfaits" },
  "cta.driver.title":   { tr: "Adaylar İçin",    en: "For Candidates",  de: "Für Bewerber",    fr: "Pour les candidats" },
  "cta.driver.desc":    { tr: "Mobil-first başvuru deneyimi, CV yönetimi, belge süreleri hatırlatma ve kriter bazlı akıllı eşleşme.", en: "Mobile-first application experience, CV management, document expiry reminders and smart criteria-based matching.", de: "Mobile-first-Bewerbungserfahrung, Lebenslaufverwaltung, Dokumentenablauf-Erinnerungen und smartes Matching.", fr: "Expérience de candidature mobile-first, gestion du CV, rappels d'expiration de documents et correspondance intelligente." },
  "cta.driver.profile": { tr: "Profilimi Oluştur", en: "Create My Profile", de: "Mein Profil erstellen", fr: "Créer mon profil" },
  "cta.driver.jobs":    { tr: "İlanları Keşfet", en: "Explore Jobs",  de: "Stellen erkunden", fr: "Explorer les offres" },

  // Neden DriverAll
  "why.title":       { tr: "Neden DriverAll?", en: "Why DriverAll?", de: "Warum DriverAll?", fr: "Pourquoi DriverAll ?" },
  "why.criteria.title": { tr: "Kriter Motoru", en: "Criteria Engine", de: "Kriterien-Engine", fr: "Moteur de critères" },
  "why.criteria.desc":  { tr: "SRC, ADR, ehliyet sınıfları, deneyim ve lokasyona göre akıllı eşleşme.", en: "Smart matching by SRC, ADR, license class, experience and location.", de: "Intelligentes Matching nach SRC, ADR, Führerscheinklasse, Erfahrung und Standort.", fr: "Correspondance intelligente par SRC, ADR, classe de permis, expérience et localisation." },
  "why.mobile.title":   { tr: "Mobil Başvuru", en: "Mobile Apply",   de: "Mobile Bewerbung", fr: "Candidature mobile" },
  "why.mobile.desc":    { tr: "Adaylar için hızlı tek-tık başvuru ve canlı süreç takibi.", en: "Fast one-tap application and live process tracking for candidates.", de: "Schnelle Ein-Klick-Bewerbung und Live-Prozessverfolgung für Kandidaten.", fr: "Candidature rapide en un clic et suivi en direct pour les candidats." },
  "why.docs.title":     { tr: "Belge Takibi",  en: "Document Tracking", de: "Dokumentenverfolgung", fr: "Suivi des documents" },
  "why.docs.desc":      { tr: "Belge bitiş tarihi hatırlatmaları, otomatik durum güncellemesi.", en: "Document expiry reminders and automatic status updates.", de: "Dokumentenablauf-Erinnerungen und automatische Statusaktualisierungen.", fr: "Rappels d'expiration et mises à jour automatiques du statut." },

  // Footer
  "footer.privacy":  { tr: "Gizlilik Politikası", en: "Privacy Policy", de: "Datenschutzrichtlinie", fr: "Politique de confidentialité" },
  "footer.terms":    { tr: "Kullanım Koşulları", en: "Terms of Use", de: "Nutzungsbedingungen", fr: "Conditions d'utilisation" },
} as const;

export type TKey = keyof typeof translations;

// ─── Tarayıcı dilini algıla ───────────────────────────────────────────────────
export function detectLang(): Lang {
  if (typeof window === "undefined") return "tr";

  // 1. localStorage'da kayıtlı tercih
  const saved = localStorage.getItem("da-lang") as Lang | null;
  if (saved && saved in LANG_LABELS) return saved;

  // 2. Tarayıcı dili
  const browser = (navigator.language || "tr").toLowerCase().split("-")[0];
  if (browser === "en") return "en";
  if (browser === "de") return "de";
  if (browser === "fr") return "fr";
  return "tr";
}

export function saveLang(lang: Lang) {
  if (typeof window !== "undefined") localStorage.setItem("da-lang", lang);
}

// ─── Çeviri fonksiyonu ────────────────────────────────────────────────────────
export function getT(lang: Lang) {
  return function t(key: TKey, fallback?: string): string {
    const entry = translations[key];
    if (!entry) return fallback ?? key;
    return (entry as any)[lang] ?? (entry as any)["tr"] ?? fallback ?? key;
  };
}
