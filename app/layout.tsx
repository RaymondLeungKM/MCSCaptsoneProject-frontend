import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// 👇 1. IMPORT AUTH PROVIDER
// (Adjust path if your file is named differently, but error says lib/auth-context.tsx)
import { AuthProvider } from "@/lib/auth-context"; 

const font = Zen_Maru_Gothic({ 
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"], 
  preload: false,
  variable: "--font-zen",
});

export const metadata: Metadata = {
  title: "Vocab Journey",
  description: "Learn vocabulary with fun stories and games!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className={`${font.className} antialiased min-h-screen bg-slate-50`}>
        {/* Figma capture script — loaded after hydration to avoid DOM injection conflicts */}
        <Script
          src="https://mcp.figma.com/mcp/html-to-design/capture.js"
          strategy="afterInteractive"
        />
        
        {/* 👇 2. WRAP EVERYTHING INSIDE AUTHPROVIDER */}
        <AuthProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
            {children}
          </ThemeProvider>
        </AuthProvider>

      </body>
    </html>
  );
}