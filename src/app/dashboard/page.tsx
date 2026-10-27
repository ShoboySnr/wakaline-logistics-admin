"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  Clock,
  Package,
  PackageX,
  TrendingUp,
  Wallet,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { useDashboard } from "@/src/api/dashboard";
import { formatDate, formatNaira } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import StatusBadge from "@/src/components/atoms/StatusBadge";
import StatCard from "@/src/components/molecules/StatCard";
import AlertPanel from "@/src/components/molecules/AlertPanel";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) return <LoadingSpinner />;

  if (isError || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">Could not load the dashboard.</p>
        <button onClick={() => refetch()} className="btn-primary">Try again</button>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-8">
      <DocumentTitle title="Dashboard" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Here&apos;s what&apos;s happening across Waka Line today.</p>
      </div>

      {(data.upcoming_maintenance.length > 0 || data.expired_bike_docs.length > 0 || data.expiring_bike_docs.length > 0 || data.low_stocks.length > 0) && (
        <div className="space-y-4">
          {data.upcoming_maintenance.length > 0 && (
            <AlertPanel tone="brand" icon={Wrench} title="Upcoming Bike Maintenance" summary={`${data.upcoming_maintenance.length} bike(s) due for maintenance within the next 7 days:`}>
              {data.upcoming_maintenance.slice(0, 5).map((bike) => (
                <li key={bike.id}>
                  <span className="font-semibold">{bike.bike_number}</span>
                  {bike.rider && ` (${bike.rider})`} – Due: {formatDate(bike.next_maintenance_date)}
                </li>
              ))}
            </AlertPanel>
          )}
          {data.expired_bike_docs.length > 0 && (
            <AlertPanel tone="red" icon={AlertTriangle} title="Expired Bike Documents" summary={`${data.expired_bike_docs.length} bike(s) have expired documents that need immediate attention:`}>
              {data.expired_bike_docs.slice(0, 3).map((bike) => (
                <li key={bike.id}>
                  <span className="font-semibold">{bike.bike_number}</span> – {bike.documents?.join(", ")}
                </li>
              ))}
            </AlertPanel>
          )}
          {data.expiring_bike_docs.length > 0 && (
            <AlertPanel tone="orange" icon={Clock} title="Documents Expiring Soon" summary={`${data.expiring_bike_docs.length} bike(s) have documents expiring within 30 days:`}>
              {data.expiring_bike_docs.slice(0, 3).map((bike) => (
                <li key={bike.id}>
                  <span className="font-semibold">{bike.bike_number}</span> – {bike.documents?.join(", ")} ({bike.days_remaining} days)
                </li>
              ))}
            </AlertPanel>
          )}
          {data.low_stocks.length > 0 && (
            <AlertPanel tone="orange" icon={PackageX} title="Low Client Stock" summary={`${data.low_stocks.length} product(s) are running out:`}>
              {data.low_stocks.map((stock) => (
                <li key={stock.id}>
                  <span className="font-semibold">{stock.client_name}</span> – {stock.product_name}: {stock.quantity} left
                </li>
              ))}
            </AlertPanel>
          )}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Today&apos;s Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Delivered Today" value={stats.today_orders} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
          <StatCard label="Today's Revenue" value={formatNaira(stats.today_revenue)} icon={Wallet} gradient="from-rose-400 to-primary" />
          <StatCard label="Pending (created today)" value={stats.today_pending} icon={Clock} gradient="from-amber-500 to-orange-600" href="/dashboard/orders?status=pending&date_filter=today" />
          <StatCard label="Active Riders" value={`${stats.active_riders} / ${stats.total_riders}`} icon={Bike} gradient="from-blue-500 to-blue-600" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">All Orders</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Orders" value={stats.total_orders} icon={Package} gradient="from-blue-500 to-blue-600" href="/dashboard/orders" />
          <StatCard label="Pending" value={stats.pending_orders} icon={Clock} gradient="from-amber-500 to-orange-600" href="/dashboard/orders?status=pending" />
          <StatCard label="In Transit" value={stats.in_transit_orders} icon={Zap} gradient="from-violet-500 to-fuchsia-600" href="/dashboard/orders?status=in_transit" />
          <StatCard label="Delivered" value={stats.delivered_orders} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" href="/dashboard/orders?status=delivered" />
          <StatCard label="Cancelled" value={stats.cancelled_orders} icon={XCircle} gradient="from-gray-500 to-gray-600" href="/dashboard/orders?status=cancelled" />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "This Week", orders: stats.week_orders, revenue: stats.week_revenue },
          { label: "This Month", orders: stats.month_orders, revenue: stats.month_revenue },
          { label: "All Time", orders: stats.total_orders, revenue: stats.total_revenue },
        ].map((period) => (
          <div key={period.label} className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{period.label}</p>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNaira(period.revenue)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{period.orders} orders</p>
          </div>
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                {["Order #", "Customer", "Delivery", "Price", "Status", "Created"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.recent_orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-6 py-3 font-medium">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">#{order.order_number}</Link>
                  </td>
                  <td className="px-6 py-3 text-gray-900 dark:text-gray-100">{order.customer_name || order.sender_name}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">{order.delivery_address}</td>
                  <td className="px-6 py-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatNaira(order.price)}</td>
                  <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                </tr>
              ))}
              {data.recent_orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
