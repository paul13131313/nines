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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${playfair.variable} ${notoSansJP.variable}`}>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
