"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/src/store";
import useHydrated from "@/src/hooks/useHydrated";
import AdminLayout from "@/src/components/layouts/AdminLayout";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const { isAuthenticated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
