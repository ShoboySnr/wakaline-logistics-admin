"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, LifeBuoy, MessageSquare, Search } from "lucide-react";
import { TicketFilters, useTickets } from "@/src/api/help";
import { formatDate, statusLabel } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";
import HelpTabs from "@/src/components/molecules/HelpTabs";
import { TicketStatus } from "@/src/types";

const STATUS_PILL: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

function TicketsContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const filters: TicketFilters = { page, status: status || undefined, search: search || undefined };
  const { data, isLoading, isFetching } = useTickets(filters);

  return (
    <div className="space-y-6">
      <DocumentTitle title="Help Center" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help Center</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Client support tickets and the FAQ knowledge base.</p>
      </div>

      <HelpTabs />

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={data.stats.total} icon={LifeBuoy} gradient="from-blue-500 to-blue-600" />
          <StatCard label="Open" value={data.stats.open} icon={Clock} gradient="from-amber-400 to-orange-500" />
          <StatCard label="In Progress" value={data.stats.in_progress} icon={MessageSquare} gradient="from-indigo-500 to-purple-600" />
          <StatCard label="Resolved" value={data.stats.resolved} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search subject, ticket number, client..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Ticket", "Subject", "Client", "Messages", "Status", "Opened"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => router.push(`/dashboard/help/tickets/${t.id}`)}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/help/tickets/${t.id}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{t.ticket_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.client?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 dark:text-gray-100">{t.messages_count}</span>
                      {t.unread_count > 0 && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">{t.unread_count} new</span>}
                    </td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[t.status as TicketStatus]}`}>{statusLabel(t.status)}</span></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No tickets match these filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={setPage} />}
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TicketsContent />
    </Suspense>
  );
}
