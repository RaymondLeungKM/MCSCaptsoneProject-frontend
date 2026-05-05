"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginCard } from "@/components/auth/login-card";
import CozyPageWrapper from "@/components/CozyPageWrapper";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/parent");
    }
  }, [authLoading, user, router]);

  return (
    <CozyPageWrapper type="center">
      <LoginCard redirectTo="/parent" />
    </CozyPageWrapper>
  );
}
