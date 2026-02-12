import type { Metadata } from "next";
// Import Zen Maru Gothic (The "Round" Font)
import { Zen_Maru_Gothic } from "next/font/google"; 
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context"; 

// Configure it with all weights so we can use "Black" (900) for titles
const zenMaru = Zen_Maru_Gothic({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"], // Note: It automatically supports Kanji/Chinese characters
  variable: "--font-zen",
});

export const metadata: Metadata = {
  title: "Vocab Journey",
  description: "Learn languages with your child",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      {/* Apply the round font globally */}
      <body className={`${zenMaru.variable} font-zen antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}