
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingScreen } from "@/components/common/loading-screen";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/dashboard");
    } else if (user) {
      if (user.role === "shopkeeper") {
        router.replace("/dashboard/shop");
      } else {
        router.replace("/dashboard/user");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  // This content will briefly show before redirection, or if redirection fails.
  // A loading state is better.
  return <LoadingScreen message="Redirecting to your dashboard..." />;
}
