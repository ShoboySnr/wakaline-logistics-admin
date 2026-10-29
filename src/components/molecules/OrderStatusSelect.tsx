"use client";

import { useUpdateOrderStatus } from "@/src/api/orders";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import { Order, OrderStatus } from "@/src/types";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "in_transit", "delivered", "cancelled"];

const STATUS_PILL: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  in_transit: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderStatusSelect({ order }: { order: Order }) {
  const notify = useNotify();
  const updateStatus = useUpdateOrderStatus(order.id);

  const onChange = async (status: OrderStatus) => {
    if (status === order.status) return;
    try {
      await updateStatus.mutateAsync(status);
      notify.success(`Status updated to ${LABELS[status]}`);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <select
      value={order.status}
      disabled={updateStatus.isPending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary disabled:opacity-60 ${STATUS_PILL[order.status]}`}
      aria-label="Change order status"
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>{LABELS[status]}</option>
      ))}
    </select>
  );
}
