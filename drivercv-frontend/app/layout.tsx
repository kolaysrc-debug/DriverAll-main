// DriverAll-main/drivercv-frontend/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import CookieConsent from "@/components/CookieConsent";
import { LanguageProvider } from "@/lib/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DriverAll • Sürücü Platformu",
    template: "%s | DriverAll",
  },
  description: "Profesyonel sürücüler ve lojistik firmaları için iş ilanları, CV yönetimi ve şoför eşleştirme platformu.",
  keywords: ["sürücü", "şoför", "iş ilanı", "lojistik", "tır şoförü", "kamyon şoförü", "driver", "cv"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://driverall.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "DriverAll",
    title: "DriverAll • Sürücü Platformu",
    description: "Profesyonel sürücüler ve lojistik firmaları için iş ilanları, CV yönetimi ve şoför eşleştirme platformu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DriverAll • Sürücü Platformu",
    description: "Profesyonel sürücüler ve lojistik firmaları için iş ilanları ve CV yönetimi.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="da-ui-v4">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}
        style={{ color: "var(--da-text)", backgroundColor: "var(--da-bg)" }}
      >
        {/* Üst menü ve Çıkış Yap butonu */}
        <LanguageProvider>
          <TopBar />

          {/* Sayfa içerikleri */}
          <main className="min-h-screen">{children}</main>

          {/* Footer */}
          <footer className="border-t py-10 px-4 text-center text-xs" style={{ borderColor: "var(--da-border)", backgroundColor: "var(--da-bg-card)" }}>
            <div className="v3-glow-line mx-auto mb-6 max-w-md" aria-hidden />
            <div className="flex flex-wrap items-center justify-center gap-5">
              <span style={{ color: "var(--da-text-2)" }}>© {new Date().getFullYear()} DriverAll</span>
              <a href="/legal/privacy" className="transition-colors hover:text-blue-400" style={{ color: "var(--da-text-3)" }}>Gizlilik Politikası</a>
              <a href="/legal/terms" className="transition-colors hover:text-blue-400" style={{ color: "var(--da-text-3)" }}>Kullanım Koşulları</a>
            </div>
          </footer>

          {/* Cookie Consent Banner */}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
