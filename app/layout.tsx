import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google"; // 👈 Back to the cute font!
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// We use weight 400 (Regular), 500 (Medium), 700 (Bold), 900 (Black)
const font = Zen_Maru_Gothic({ 
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"], 
  preload: false, // 👈 IMPORTANT: Fixes the build error!
  variable: "--font-zen",
});

export const metadata: Metadata = {
  title: "Vocab Journey",
  description: "Learn vocabulary with fun stories and games!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} antialiased min-h-screen bg-slate-50`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}