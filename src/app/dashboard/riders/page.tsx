"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bike, CheckCircle2, PauseCircle, Plus, Search, Star, XCircle } from "lucide-react";
import { RiderFilters, useRiders } from "@/src/api/riders";
import { formatDate, statusLabel } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";

const STATUS_PILL: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function RidersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: RiderFilters = {
    page: Number(searchParams.get("page") ?? 1),
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  };

  const [search, setSearch] = useState(filters.search ?? "");
  const { data, isLoading, isFetching } = useRiders(filters);

  const setFilters = (changes: Partial<Record<keyof RiderFilters, string | number | undefined>>) => {
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
      <DocumentTitle title="Riders" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Riders</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Dispatch riders who move deliveries for Waka Line.</p>
        </div>
        <Link href="/dashboard/riders/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Rider
        </Link>
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Riders" value={data.stats.total} icon={Bike} gradient="from-blue-500 to-blue-600" />
          <StatCard label="Active" value={data.stats.active} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
          <StatCard label="Inactive" value={data.stats.inactive} icon={XCircle} gradient="from-gray-500 to-gray-600" />
          <StatCard label="Suspended" value={data.stats.suspended} icon={PauseCircle} gradient="from-rose-400 to-primary" />
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search name, phone, email, plate..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filters.status ?? ""} onChange={(e) => setFilters({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Rider", "Contact", "Vehicle", "Orders", "Rating", "Status", "Joined"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((rider) => (
                  <tr key={rider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => router.push(`/dashboard/riders/${rider.id}`)}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/riders/${rider.id}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {rider.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-gray-100">{rider.phone || "—"}</p>
                      <p className="text-xs text-gray-500">{rider.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {rider.vehicle_type ? (
                        <>
                          <p className="text-gray-900 dark:text-gray-100 capitalize">{rider.vehicle_type}</p>
                          {rider.vehicle_number && <p className="text-xs text-gray-500">{rider.vehicle_number}</p>}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{rider.orders_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-900 dark:text-gray-100">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {rider.rating != null ? Number(rider.rating).toFixed(2) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[rider.status] ?? STATUS_PILL.inactive}`}>
                        {statusLabel(rider.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(rider.created_at)}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No riders match these filters</td>
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

export default function RidersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RidersContent />
    </Suspense>
  );
}
