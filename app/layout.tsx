import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { LanguageProvider } from "@/contexts/language-context";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aiad.kr";

export const metadata: Metadata = {
  title: {
    default: "AIAD - AI 광고 콘텐츠 생성 플랫폼 | 이미지, 영상, 아바타 광고 제작",
    template: "%s | AIAD",
  },
  description: "AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하세요. AI 아바타, 제품 광고, 배경 음악까지 원클릭으로 제작. 마케터와 크리에이터를 위한 올인원 AI 광고 솔루션.",
  keywords: [
    "AI 광고",
    "AI 광고 제작",
    "AI 이미지 생성",
    "AI 영상 광고",
    "AI 아바타",
    "광고 자동화",
    "마케팅 AI",
    "제품 광고",
    "SNS 광고",
    "인스타그램 광고",
    "페이스북 광고",
    "숏폼 광고",
    "AI 마케팅 도구",
    "광고 콘텐츠 생성",
    "이커머스 광고",
  ],
  authors: [{ name: "AIAD", url: siteUrl }],
  creator: "AIAD",
  publisher: "AIAD",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
      "en-US": "/en",
      "ja-JP": "/ja",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US", "ja_JP"],
    url: siteUrl,
    title: "AIAD - AI 광고 콘텐츠 생성 플랫폼",
    description: "AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하세요. 마케터와 크리에이터를 위한 올인원 AI 광고 솔루션.",
    siteName: "AIAD",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AIAD - AI 광고 콘텐츠 생성 플랫폼",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIAD - AI 광고 콘텐츠 생성 플랫폼",
    description: "AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하세요.",
    images: ["/og-image.png"],
    creator: "@aiad_kr",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
  verification: {
    // Google Search Console 등록 시 추가
    // google: "your-google-verification-code",
    // Naver 웹마스터 도구 등록 시 추가
    // other: { "naver-site-verification": "your-naver-verification-code" },
  },
};

// JSON-LD 구조화 데이터
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AIAD",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "AI로 전문적인 광고 이미지와 영상을 몇 분 만에 생성하는 올인원 AI 광고 플랫폼",
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
    description: "무료 체험 제공",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
  },
  featureList: [
    "AI 이미지 광고 생성",
    "AI 영상 광고 생성",
    "AI 아바타 생성",
    "AI 배경 음악 생성",
    "제품 광고 자동화",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
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