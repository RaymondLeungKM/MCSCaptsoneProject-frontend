import React from "react"
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parent Dashboard - WordWorld',
  description: 'Track your child\'s vocabulary learning progress',
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
