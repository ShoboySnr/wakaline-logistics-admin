"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCheck, Copy, Loader2 } from "lucide-react";
import { useMarkRemitted } from "@/src/api/orders";
import { formatNaira } from "@/src/helpers/format";
import { buildRemittanceSummary, signedNaira } from "@/src/helpers/remittance";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import { RemittanceData } from "@/src/types";
import Panel from "./Panel";

export default function RemittanceSection({ data, onChanged }: { data: RemittanceData; onChanged: () => void }) {
  const [copied, setCopied] = useState(false);
  const markRemitted = useMarkRemitted();
  const notify = useNotify();
  const hasOrders = data.orders.length > 0;

  const copy = async () => {
    await navigator.clipboard.writeText(buildRemittanceSummary(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markAll = async () => {
    if (!confirm(`Mark all ${data.orders.length} order(s) as remitted?`)) return;
    try {
      const res = await markRemitted.mutateAsync({ client_id: data.client_id, order_ids: data.orders.map((o) => o.id) });
      notify.success(res.message);
      onChanged();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Panel
      title="Pay on Delivery — Pending Remittance"
      padded={false}
      subtitle={
        hasOrders && (
          <>
            {data.orders.length} order{data.orders.length > 1 ? "s" : ""} · Total to remit:{" "}
            <span className="font-semibold text-primary">{signedNaira(data.total_remittance)}</span>
          </>
        )
      }
      actions={
        hasOrders && (
          <>
            <button onClick={copy} className="btn-secondary py-1.5">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Summary"}
            </button>
            <button onClick={markAll} disabled={markRemitted.isPending} className="btn-primary py-1.5">
              {markRemitted.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark All Remitted
            </button>
          </>
        )
      }
    >
      {hasOrders ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                {["Order #", "Delivery Address", "Drop-off", "Received", "Fee", "To Remit"].map((h, i) => (
                  <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.orders.map((order) => (
                <tr key={order.id} className={order.is_failed ? "bg-red-50 dark:bg-red-900/20" : ""}>
                  <td className="px-6 py-3 font-medium whitespace-nowrap">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">#{order.order_number}</Link>
                    {order.is_failed && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">Failed</span>}
                    {order.products.length > 0 && (
                      <p className="text-xs text-gray-500 font-normal mt-0.5">{order.products.map((p) => `${p.product_name} x${p.quantity}`).join(", ")}</p>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">{order.delivery_address}</td>
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{order.date}</td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">{order.is_failed ? "—" : formatNaira(order.amount_received)}</td>
                  <td className="px-6 py-3 text-right text-red-600 whitespace-nowrap">−{formatNaira(order.delivery_fee)}</td>
                  <td className={`px-6 py-3 text-right font-semibold whitespace-nowrap ${order.is_failed ? "text-red-600" : "text-primary"}`}>{signedNaira(order.to_remit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-6 py-8 text-center text-sm text-gray-500">No pending POD remittances. All cash orders have been settled.</p>
      )}
    </Panel>
  );
}
