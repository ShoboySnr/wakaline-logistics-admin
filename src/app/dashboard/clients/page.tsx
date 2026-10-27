"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Banknote, CheckCircle2, Plus, Search, Users, XCircle } from "lucide-react";
import { ClientFilters, useClients } from "@/src/api/clients";
import { formatDate } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";

function ClientsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: ClientFilters = {
    page: Number(searchParams.get("page") ?? 1),
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    remittance: searchParams.get("remittance") ?? undefined,
  };

  const [search, setSearch] = useState(filters.search ?? "");
  const { data, isLoading, isFetching } = useClients(filters);

  const setFilters = (changes: Partial<Record<keyof ClientFilters, string | number | undefined>>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    if (!("page" in changes)) params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (filters.search ?? "")) setFilters({ search });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-6">
      <DocumentTitle title="Clients" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Businesses and individuals who send with Waka Line.</p>
        </div>
        <Link href="/dashboard/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Client
        </Link>
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Clients" value={data.stats.total} icon={Users} gradient="from-blue-500 to-blue-600" />
          <StatCard label="Active" value={data.stats.active} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
          <StatCard label="Inactive" value={data.stats.inactive} icon={XCircle} gradient="from-gray-500 to-gray-600" />
          <StatCard label="Daily Remittance" value={data.stats.remittance} icon={Banknote} gradient="from-rose-400 to-primary" />
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search name, company, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filters.status ?? ""} onChange={(e) => setFilters({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="accent-primary" checked={filters.remittance === "1"} onChange={(e) => setFilters({ remittance: e.target.checked ? "1" : undefined })} />
            Daily remittance only
          </label>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Client", "Contact", "Orders", "Features", "Status", "Joined"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/clients/${client.id}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {client.name}
                      </Link>
                      {client.company_name && <p className="text-xs text-gray-500">{client.company_name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-gray-100">{client.phone || "—"}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{client.orders_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {client.pod_remittance_enabled && <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary">Remittance</span>}
                        {client.api_enabled && <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 text-indigo-700">API</span>}
                        {client.dashboard_enabled && <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700">Dashboard</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${client.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {client.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(client.created_at)}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No clients match these filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={(page) => setFilters({ page })} />}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientsContent />
    </Suspense>
  );
}
