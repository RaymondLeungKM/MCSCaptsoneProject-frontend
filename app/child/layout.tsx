import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Child Dashboard | Vocab Journey",
  description: "Fun learning zone for kids",
};

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We just pass through the children because the Page wrapper 
    // handles the background and styling.
    <div className="w-full min-h-screen">
      {children}
    </div>
  );
}