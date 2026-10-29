"use client";

import { Suspense, useState } from "react";
import { CheckCircle2, Clock, Receipt, Search } from "lucide-react";
import { TransactionFilters, useTransaction, useTransactionAction, useTransactions } from "@/src/api/transactions";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Modal from "@/src/components/atoms/Modal";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";
import { TransactionStatus } from "@/src/types";

const STATUS_PILL: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  reversed: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

function TransactionModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const notify = useNotify();
  const { data: tx, isLoading } = useTransaction(id);
  const { approve, reject, reverse } = useTransactionAction();

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      notify.success(success);
      onClose();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const onReject = () => {
    const reason = prompt("Reason for rejecting this transaction?");
    if (reason && id) run(() => reject.mutateAsync({ id, reason }), "Transaction rejected");
  };

  const onReverse = () => {
    const reason = prompt("Reason for reversing this transaction?");
    if (reason && id) run(() => reverse.mutateAsync({ id, reason }), "Transaction reversed");
  };

  const busy = approve.isPending || reject.isPending || reverse.isPending;

  return (
    <Modal
      open={id !== null}
      onClose={onClose}
      title={tx ? tx.transaction_reference ?? `Transaction #${tx.id}` : "Transaction"}
      subtitle={tx?.client?.name}
      footer={
        tx && (tx.status === "pending" || tx.status === "completed") ? (
          <div className="flex justify-end gap-2">
            {tx.status === "pending" && (
              <>
                <button onClick={onReject} disabled={busy} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">Reject</button>
                <button onClick={() => id && run(() => approve.mutateAsync(id), "Transaction approved")} disabled={busy} className="btn-primary">Approve</button>
              </>
            )}
            {tx.status === "completed" && (
              <button onClick={onReverse} disabled={busy} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">Reverse</button>
            )}
          </div>
        ) : undefined
      }
    >
      {isLoading || !tx ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <dl className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-gray-500">Status</dt><dd className="mt-0.5"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_PILL[tx.status]}`}>{statusLabel(tx.status)}</span></dd></div>
          <div><dt className="text-xs text-gray-500">Type</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{statusLabel(tx.type)}</dd></div>
          <div><dt className="text-xs text-gray-500">Credits</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.credits}</dd></div>
          <div><dt className="text-xs text-gray-500">Amount Paid</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.amount_paid != null ? formatNaira(tx.amount_paid) : "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Payment Method</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.payment_method ? statusLabel(tx.payment_method) : "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Payment Reference</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100 break-all">{tx.payment_reference ?? "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Balance Before</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.balance_before ?? "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Balance After</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.balance_after ?? "—"}</dd></div>
          {tx.subscription_plan && <div><dt className="text-xs text-gray-500">Plan</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.subscription_plan}</dd></div>}
          {tx.credit_package && <div><dt className="text-xs text-gray-500">Package</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.credit_package}</dd></div>}
          {tx.order_number && <div><dt className="text-xs text-gray-500">Order</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.order_number}</dd></div>}
          <div className="sm:col-span-2"><dt className="text-xs text-gray-500">Description</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{tx.description ?? "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-gray-500">Created</dt><dd className="mt-0.5 text-gray-900 dark:text-gray-100">{formatDate(tx.created_at, true)}</dd></div>
        </dl>
      )}
    </Modal>
  );
}

function TransactionsContent() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filters: TransactionFilters = { page, status: status || undefined, type: type || undefined, search: search || undefined };
  const { data, isLoading, isFetching } = useTransactions(filters);

  return (
    <div className="space-y-6">
      <DocumentTitle title="Transactions" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Credit purchases, usage and refunds across all clients.</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={data.stats.total} icon={Receipt} gradient="from-blue-500 to-blue-600" />
          <StatCard label="Pending" value={data.stats.pending} icon={Clock} gradient="from-amber-400 to-orange-500" />
          <StatCard label="Completed" value={data.stats.completed} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
          <StatCard label="Revenue" value={formatNaira(data.stats.total_amount)} icon={Receipt} gradient="from-rose-400 to-primary" />
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search reference or description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
          </select>
          <select className="input" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="purchase">Purchase</option>
            <option value="usage">Usage</option>
            <option value="refund">Refund</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Reference", "Client", "Type", "Credits", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => setSelectedId(tx.id)}>
                    <td className="px-4 py-3 font-medium text-primary">{tx.transaction_reference ?? `#${tx.id}`}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{tx.client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{statusLabel(tx.type)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{tx.credits}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">{tx.amount_paid != null ? formatNaira(tx.amount_paid) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[tx.status as TransactionStatus]}`}>{statusLabel(tx.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No transactions match these filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={setPage} />}
      </div>

      <TransactionModal id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TransactionsContent />
    </Suspense>
  );
}
