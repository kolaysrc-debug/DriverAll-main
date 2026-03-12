// DriverAll-main/drivercv-frontend/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";

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
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        {/* Üst menü ve Çıkış Yap butonu */}
        <TopBar />

        {/* Sayfa içerikleri */}
        <main className="min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span>© {new Date().getFullYear()} DriverAll</span>
            <a href="/legal/privacy" className="hover:text-emerald-400 transition-colors">Gizlilik Politikası</a>
            <a href="/legal/terms" className="hover:text-emerald-400 transition-colors">Kullanım Koşulları</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
