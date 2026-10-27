"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCheck, Copy, Loader2 } from "lucide-react";
import Modal from "../atoms/Modal";
import LoadingSpinner from "../atoms/LoadingSpinner";
import { useMarkRemitted, useOrderFormOptions, useRemittance } from "@/src/api/orders";
import { formatNaira } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import { buildRemittanceSummary, signedNaira } from "@/src/helpers/remittance";

export default function RemitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [clientId, setClientId] = useState("");
  const [copied, setCopied] = useState(false);
  const { data: options } = useOrderFormOptions();
  const { data, isFetching, isError, error } = useRemittance(clientId);
  const markRemitted = useMarkRemitted();
  const notify = useNotify();

  const hasOrders = !!data && data.orders.length > 0;
  const bankFields = data
    ? [
        ["Bank", data.bank.bank_name],
        ["Account Number", data.bank.account_number],
        ["Account Name", data.bank.account_name],
      ]
    : [];
  const hasBank = bankFields.some(([, value]) => value);

  const copySummary = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(buildRemittanceSummary(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkRemitted = async () => {
    if (!data || !confirm("Mark all listed orders as remitted?")) return;
    try {
      const res = await markRemitted.mutateAsync({ client_id: data.client_id, order_ids: data.orders.map((o) => o.id) });
      notify.success(res.message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daily Remittance"
      subtitle="Pay-on-delivery cash to hand over to the client"
      size="xl"
      footer={
        hasOrders && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">{data.orders.length} order(s) pending remittance</span>
            <div className="flex gap-2">
              <button onClick={copySummary} className="btn-secondary">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Summary"}
              </button>
              <button onClick={handleMarkRemitted} disabled={markRemitted.isPending} className="btn-primary">
                {markRemitted.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                Mark All Remitted
              </button>
            </div>
          </div>
        )
      }
    >
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <label className="label">Client</label>
        <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">-- Select a client --</option>
          {options?.remittance_clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.company_name ? ` (${c.company_name})` : ""}
            </option>
          ))}
        </select>
      </div>

      {!clientId && <p className="py-16 text-center text-sm text-gray-400">Select a client above to load their pending remittances</p>}
      {clientId && isFetching && <LoadingSpinner fullScreen={false} />}
      {clientId && !isFetching && isError && <p className="py-16 text-center text-sm text-red-500">{errorMessage(error)}</p>}
      {clientId && !isFetching && data && !hasOrders && (
        <p className="py-16 text-center text-sm font-medium text-gray-500">All settled — no pending remittances for this client.</p>
      )}

      {clientId && !isFetching && hasOrders && (
        <>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="rounded-lg p-4 bg-primary/5 border border-primary/40">
              <p className="text-sm font-semibold text-primary mb-2">Client Bank Details</p>
              {hasBank ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {bankFields.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No bank details saved. Add them on the client&apos;s edit page.</p>
              )}
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 sticky top-0">
              <tr>
                {["Order #", "Delivery Address", "Drop-off", "Received", "Fee", "To Remit"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.orders.map((order) => (
                <tr key={order.id} className={order.is_failed ? "bg-red-50 dark:bg-red-900/20" : ""}>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">#{order.order_number}</Link>
                    {order.is_failed && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">Failed</span>}
                    {order.products.length > 0 && (
                      <p className="text-xs text-gray-500 font-normal mt-0.5">{order.products.map((p) => `${p.product_name} x${p.quantity}`).join(", ")}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{order.delivery_address}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{order.date}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{order.is_failed ? "—" : formatNaira(order.amount_received)}</td>
                  <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">−{formatNaira(order.delivery_fee)}</td>
                  <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${order.is_failed ? "text-red-600" : "text-primary"}`}>{signedNaira(order.to_remit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-900/40 border-t-2 border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Total to Remit</td>
                <td className="px-4 py-3 text-right font-bold text-primary whitespace-nowrap">{signedNaira(data.total_remittance)}</td>
              </tr>
            </tfoot>
          </table>

          {data.stocks.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Stock left after this remittance</p>
              <div className="flex flex-wrap gap-2">
                {data.stocks.map((stock) => (
                  <span key={stock.product_name} className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    {stock.product_name}: {stock.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
