import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import { Home, Music, Plus, Clock } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Setlist App - セトリ記録アプリ",
  description: "ライブのセットリストを記録・管理し、あなたの参加履歴とアーティスト別ランキングを集計できるアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Setlist App",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192" },
      { url: "/icon-512x512.png", sizes: "512x512" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {children}
        <Toaster position="top-center" />
        
        {/* Service Worker 登録スクリプト */}
        <Script
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {
                    // Service Worker登録エラーは無視
                  });
                });
              }
            `,
          }}
        />
        
        {/* ボトムナビゲーションバー */}
        <nav className="fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-md border border-sky-100 rounded-full flex justify-around items-center py-3 shadow-lg z-50">
          {/* ホーム */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-4 py-3 text-sky-600 hover:text-sky-700 transition-colors"
          >
            <Home size={24} />
            <span className="text-xs font-medium">ホーム</span>
          </Link>
          
          {/* 入力 */}
          <Link
            href="/input"
            className="flex flex-col items-center gap-1 px-4 py-3 text-sky-600 hover:text-sky-700 transition-colors"
          >
            <Plus size={24} />
            <span className="text-xs font-medium">入力</span>
          </Link>
          
          {/* ランキング */}
          <Link
            href="/songs"
            className="flex flex-col items-center gap-1 px-4 py-3 text-sky-600 hover:text-sky-700 transition-colors"
          >
            <Music size={24} />
            <span className="text-xs font-medium">ランキング</span>
          </Link>
          
          {/* 履歴 */}
          <Link
            href="/history"
            className="flex flex-col items-center gap-1 px-4 py-3 text-sky-600 hover:text-sky-700 transition-colors"
          >
            <Clock size={24} />
            <span className="text-xs font-medium">履歴</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
