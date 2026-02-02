import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { ClarityScript } from "@/components/analytics/clarity";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gwanggo.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "gwanggo",
    template: "%s | gwanggo",
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
    google: "AFp7Yd97bOBEafFj1s7Def5JpcDUV8AXvaLdNidfO0U",
    other: { "naver-site-verification": "8d36a0924d8a9611353f704b0900cb50bbfceb94" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
