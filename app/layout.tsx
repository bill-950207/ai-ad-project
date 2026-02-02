import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { ClarityScript } from "@/components/analytics/clarity";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AIAD - AI 광고 콘텐츠 생성 플랫폼",
    template: "%s | AIAD",
  },
  description: "AI로 전문적인 광고 이미지와 영상을 빠르게 생성하세요. 아바타, 제품 광고, 배경 음악까지 한 번에.",
  keywords: ["AI 광고", "이미지 생성", "영상 광고", "아바타 생성", "광고 제작", "AI 마케팅"],
  authors: [{ name: "AIAD" }],
  creator: "AIAD",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://aiad.com"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: "AIAD - AI 광고 콘텐츠 생성 플랫폼",
    description: "AI로 전문적인 광고 이미지와 영상을 빠르게 생성하세요.",
    siteName: "AIAD",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AIAD - AI 광고 생성",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIAD - AI 광고 콘텐츠 생성 플랫폼",
    description: "AI로 전문적인 광고 이미지와 영상을 빠르게 생성하세요.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console 등록 시 추가
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClarityScript />
        <GoogleAnalytics />
        <SupabaseProvider
          supabaseUrl={process.env.SUPABASE_URL!}
          supabaseAnonKey={process.env.SUPABASE_ANON_KEY!}
        >
          <LanguageProvider>
            <Navbar />
            <div className="pt-16">
              {children}
            </div>
          </LanguageProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}