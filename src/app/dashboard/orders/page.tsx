"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Banknote, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { OrderFilters, useDeleteOrder, useOrderFormOptions, useOrders } from "@/src/api/orders";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import StatusBadge from "@/src/components/atoms/StatusBadge";
import Pagination from "@/src/components/molecules/Pagination";
import RemitModal from "@/src/components/modals/RemitModal";

const FILTER_KEYS: (keyof OrderFilters)[] = ["status", "search", "client_id", "date_filter", "start_date", "end_date", "no_delivery_date"];

const DATE_FILTERS = [
  ["", "All time"],
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["this_week", "This week"],
  ["last_week", "Last week"],
  ["this_month", "This month"],
  ["this_year", "This year"],
  ["custom", "Custom range"],
];

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notify = useNotify();
  const [remitOpen, setRemitOpen] = useState(false);

  const filters: OrderFilters = { page: Number(searchParams.get("page") ?? 1) };
  FILTER_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) (filters as Record<string, string | number>)[key] = value;
  });

  const [search, setSearch] = useState(filters.search ?? "");
  const { data, isLoading, isFetching } = useOrders(filters);
  const { data: options } = useOrderFormOptions();
  const deleteOrder = useDeleteOrder();

  const setFilters = (changes: Partial<Record<keyof OrderFilters, string | number | undefined>>) => {
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

  const handleDelete = async (id: number, orderNumber: string) => {
    if (!confirm(`Delete order #${orderNumber}? This cannot be undone.`)) return;
    try {
      await deleteOrder.mutateAsync(id);
      notify.success("Order deleted");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const stats = data?.stats;
  const statusTabs = ["all", ...(options?.statuses ?? ["pending", "confirmed", "in_transit", "delivered", "cancelled"])];

  return (
    <div className="space-y-6">
      <DocumentTitle title="Orders" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRemitOpen(true)} className="btn-secondary">
            <Banknote className="w-4 h-4" />
            Daily Remit
          </button>
          <Link href="/dashboard/orders/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Revenue Today", formatNaira(stats.revenue_today), `${stats.today_delivered} delivered`],
            ["Revenue This Week", formatNaira(stats.revenue_week), "Delivered orders"],
            ["Revenue This Month", formatNaira(stats.revenue_month), "Delivered orders"],
            ["Incoming Today", formatNaira(stats.incoming_revenue_today), `This week: ${formatNaira(stats.incoming_revenue_week)}`],
          ].map(([label, value, hint]) => (
            <div key={label} className="card p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{hint}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="flex gap-1 overflow-x-auto px-4 pt-4 border-b border-gray-200 dark:border-gray-700">
          {statusTabs.map((status) => {
            const active = (filters.status ?? "all") === status;
            const count = stats ? (status === "all" ? stats.total : stats[status as keyof typeof stats]) : undefined;
            return (
              <button
                key={status}
                onClick={() => setFilters({ status: status === "all" ? undefined : status })}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {status === "all" ? "All" : statusLabel(status)}
                {count !== undefined && <span className="ml-1.5 text-xs text-gray-400">({count})</span>}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search order #, name, phone, address..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={filters.client_id ?? ""} onChange={(e) => setFilters({ client_id: e.target.value })}>
            <option value="">All clients</option>
            {options?.clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` (${c.company_name})` : ""}</option>
            ))}
          </select>
          <select className="input" value={filters.date_filter ?? ""} onChange={(e) => setFilters({ date_filter: e.target.value, start_date: undefined, end_date: undefined })}>
            {DATE_FILTERS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {filters.date_filter === "custom" && (
            <>
              <input type="date" className="input" value={filters.start_date ?? ""} onChange={(e) => setFilters({ start_date: e.target.value })} />
              <input type="date" className="input" value={filters.end_date ?? ""} onChange={(e) => setFilters({ end_date: e.target.value })} />
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              className="accent-primary"
              checked={filters.no_delivery_date === "1"}
              onChange={(e) => setFilters({ no_delivery_date: e.target.checked ? "1" : undefined })}
            />
            No drop-off date
          </label>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Order #", "Customer", "Route", "Rider", "Price", "Status", "Created", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">#{order.order_number}</Link>
                      {order.is_failed_delivery && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">Failed</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-gray-100">{order.customer_name || order.sender_name}</p>
                      {order.client && <p className="text-xs text-gray-500">{order.client.name}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-600 dark:text-gray-300 truncate">{order.pickup_address}</p>
                      <p className="text-gray-900 dark:text-gray-100 truncate">→ {order.delivery_address}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{order.rider?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatNaira(order.price)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/dashboard/orders/${order.id}`} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/dashboard/orders/${order.id}/edit`} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(order.id, order.order_number)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No orders match these filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={(page) => setFilters({ page })} />}
      </div>

      <RemitModal open={remitOpen} onClose={() => setRemitOpen(false)} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrdersContent />
    </Suspense>
  );
}
