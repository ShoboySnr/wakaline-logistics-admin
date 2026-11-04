"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Wallet } from "lucide-react";
import { useConfirmPayment, usePaymentQueue } from "@/src/api/orders";
import { formatNaira, formatDate } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";

export default function PaymentsPage() {
  const notify = useNotify();
  const { data, isLoading } = usePaymentQueue();
  const confirmPayment = useConfirmPayment();
  const [busy, setBusy] = useState<number | null>(null);

  const confirm = async (id: number, orderNumber: string) => {
    setBusy(id);
    try {
      await confirmPayment.mutateAsync(id);
      notify.success(`Payment confirmed for ${orderNumber}.`);
    } catch (e) {
      notify.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const orders = data?.data ?? [];
  const awaiting = data?.stats.awaiting_confirmation ?? 0;

  return (
    <div className="space-y-5">
      <DocumentTitle title="Payments" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments awaiting confirmation</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
          Riders mark payments as collected on delivery. Confirm each one here so the rider is cleared.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
          Nothing waiting — all collected payments are confirmed.
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{awaiting} payment{awaiting === 1 ? "" : "s"} to confirm</p>
          <div className="card divide-y divide-gray-100 dark:divide-gray-700">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-sm font-semibold text-primary hover:underline">
                      {order.order_number}
                    </Link>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                      <Wallet className="w-4 h-4 text-gray-400" /> {formatNaira(order.price)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {order.rider?.name ?? "Unassigned"}
                    {order.payment_collected_at ? <> · collected {formatDate(order.payment_collected_at, true)}</> : null}
                  </p>
                </div>
                <button onClick={() => confirm(order.id, order.order_number)} disabled={busy !== null} className="btn-primary shrink-0">
                  {busy === order.id ? "…" : (<><CheckCircle2 className="w-4 h-4" /> Payment confirmed</>)}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
