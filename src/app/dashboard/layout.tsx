"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/src/store";
import useHydrated from "@/src/hooks/useHydrated";
import AdminLayout from "@/src/components/layouts/AdminLayout";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner fullScreen={false} />
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
