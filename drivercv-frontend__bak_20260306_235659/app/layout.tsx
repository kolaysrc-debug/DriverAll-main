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
  title: "DriverAll • Sürücü Platformu",
  description: "Profesyonel sürücüler ve lojistik firmaları için DriverAll",
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
      </body>
    </html>
  );
}
