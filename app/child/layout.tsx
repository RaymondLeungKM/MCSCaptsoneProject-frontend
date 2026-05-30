"use client";

import type { Metadata } from "next";
import { useEffect } from "react";

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add a class on <html> so that rem-based Tailwind text-* classes scale up.
  // Removing on unmount restores normal sizes for other pages.
  useEffect(() => {
    document.documentElement.classList.add("kid-font-scale");
    return () => {
      document.documentElement.classList.remove("kid-font-scale");
    };
  }, []);

  return (
    <div className="kid-mode w-full min-h-screen" suppressHydrationWarning>
      {children}
    </div>
  );
}