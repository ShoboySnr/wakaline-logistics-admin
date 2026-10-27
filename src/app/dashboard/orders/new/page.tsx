"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import OrderForm from "@/src/components/organisms/OrderForm";

function NewOrderForm() {
  const clientId = useSearchParams().get("client_id") ?? undefined;
  return <OrderForm defaultClientId={clientId} />;
}

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <DocumentTitle title="New Order" />
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Order</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Fill in the delivery details below.</p>
      </div>
      <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
        <NewOrderForm />
      </Suspense>
    </div>
  );
}
