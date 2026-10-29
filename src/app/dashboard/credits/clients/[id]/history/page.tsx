"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useClientCreditHistory } from "@/src/api/credits";
import { formatDate, statusLabel } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Pagination from "@/src/components/molecules/Pagination";

export default function CreditHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useClientCreditHistory(id, page);

  return (
    <div className="space-y-6">
      <DocumentTitle title="Credit History" />
      <Link href={`/dashboard/clients/${id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Client
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Credit History</h1>
        {data && <p className="text-gray-600 dark:text-gray-400 mt-1">{data.client.name} · {data.client.available_credits.toLocaleString()} credits available</p>}
      </div>

      <div className="card">
        {isLoading ? <LoadingSpinner fullScreen={false} /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>{["Date", "Reference", "Type", "Credits", "Balance", "By"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.created_at, true)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{t.reference ?? "—"}</td>
                    <td className="px-4 py-3">{statusLabel(t.type)}</td>
                    <td className={`px-4 py-3 font-medium ${t.credits >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{t.credits >= 0 ? "+" : ""}{t.credits}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{t.balance_after ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{t.processed_by ?? "—"}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No credit transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination meta={data.meta} onChange={setPage} />}
      </div>
    </div>
  );
}
