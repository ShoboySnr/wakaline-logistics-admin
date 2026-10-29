"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Bike, CheckCircle2, Plus, Search, Wrench } from "lucide-react";
import { BikeFilters, useBikes } from "@/src/api/bikes";
import { formatDate, statusLabel } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";

const STATUS_PILL: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

function BikesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: BikeFilters = {
    page: Number(searchParams.get("page") ?? 1),
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    expiring: searchParams.get("expiring") ?? undefined,
    expired: searchParams.get("expired") ?? undefined,
  };

  const [search, setSearch] = useState(filters.search ?? "");
  const { data, isLoading, isFetching } = useBikes(filters);

  const setFilters = (changes: Partial<Record<keyof BikeFilters, string | number | undefined>>) => {
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
      <DocumentTitle title="Bikes" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bikes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">The fleet, their documents and who rides them.</p>
        </div>
        <Link href="/dashboard/bikes/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Bike
        </Link>
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Bikes" value={data.stats.total} icon={Bike} gradient="from-blue-500 to-blue-600" />
          <StatCard label="Active" value={data.stats.active} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
          <StatCard label="In Maintenance" value={data.stats.maintenance} icon={Wrench} gradient="from-amber-400 to-orange-500" />
          <StatCard label="Expiring Docs" value={data.stats.expiring_docs} icon={AlertTriangle} gradient="from-rose-400 to-primary" />
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search bike number, plate, brand..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filters.status ?? ""} onChange={(e) => setFilters({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="input" value={filters.expired === "1" ? "expired" : filters.expiring === "1" ? "expiring" : ""} onChange={(e) => setFilters({ expiring: e.target.value === "expiring" ? "1" : undefined, expired: e.target.value === "expired" ? "1" : undefined })}>
            <option value="">All documents</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Bike", "Plate", "Assigned Rider", "Documents", "Status", "Added"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((bike) => (
                  <tr key={bike.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => router.push(`/dashboard/bikes/${bike.id}`)}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/bikes/${bike.id}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {bike.bike_number}
                      </Link>
                      {(bike.brand || bike.model) && <p className="text-xs text-gray-500">{[bike.brand, bike.model].filter(Boolean).join(" ")}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">{bike.plate_number}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {bike.assigned_rider ? bike.assigned_rider.name : <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      {bike.has_expired_documents ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400"><AlertTriangle className="w-3.5 h-3.5" /> Expired</span>
                      ) : bike.has_expiring_documents ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400"><AlertTriangle className="w-3.5 h-3.5" /> Expiring</span>
                      ) : (
                        <span className="text-xs text-gray-400">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[bike.status] ?? STATUS_PILL.inactive}`}>{statusLabel(bike.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(bike.created_at)}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No bikes match these filters</td>
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

export default function BikesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BikesContent />
    </Suspense>
  );
}
