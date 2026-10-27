"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useOrder } from "@/src/api/orders";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import OrderForm from "@/src/components/organisms/OrderForm";

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) return <LoadingSpinner />;
  if (!order) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Order not found. <Link href="/dashboard/orders" className="text-primary hover:underline">Back to orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentTitle title={`Edit Order #${order.order_number}`} />
      <Link href={`/dashboard/orders/${order.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Order
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Order #{order.order_number}</h1>
      </div>
      <OrderForm key={order.updated_at} order={order} />
    </div>
  );
}
