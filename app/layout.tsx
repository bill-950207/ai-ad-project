import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { LanguageProvider } from "@/contexts/language-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADAI - AI-Powered Ad Content Generator",
  description: "Create stunning ad content with AI. Generate images and videos for your marketing campaigns in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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