import type { Metadata } from "next";
import { Playfair_Display, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "nines — 好きな9つでつながる",
  description: "好きなコンテンツを9マスに並べるキュレーションSNS",
  metadataBase: new URL("https://nines-seven.vercel.app"),
  openGraph: {
    title: "nines — 好きな9つでつながる",
    description: "好きなコンテンツを9マスに並べるキュレーションSNS",
    url: "https://nines-seven.vercel.app",
    siteName: "nines",
    images: [{ url: "https://nines-seven.vercel.app/ogp.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "nines — 好きな9つでつながる",
    description: "好きなコンテンツを9マスに並べるキュレーションSNS",
    images: ["https://nines-seven.vercel.app/ogp.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "nines",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#DBD6CD" />
      </head>
      <body className={`${playfair.variable} ${notoSansJP.variable}`}>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
