"use client";

import { CreditCard, TrendingUp, Users } from "lucide-react";
import { useCreditOverview } from "@/src/api/credits";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import StatCard from "@/src/components/molecules/StatCard";
import Panel from "@/src/components/organisms/client/Panel";
import CreditTabs from "@/src/components/molecules/CreditTabs";

export default function CreditsOverviewPage() {
  const { data, isLoading } = useCreditOverview();

  return (
    <div className="space-y-6">
      <DocumentTitle title="Credits & Plans" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Credits &amp; Plans</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Subscription plans, credit packages and client balances.</p>
      </div>
      <CreditTabs />

      {isLoading || !data ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Credits Sold" value={data.stats.total_credits_sold.toLocaleString()} icon={TrendingUp} gradient="from-emerald-500 to-green-600" />
            <StatCard label="Credits Used" value={data.stats.total_credits_used.toLocaleString()} icon={CreditCard} gradient="from-blue-500 to-blue-600" />
            <StatCard label="Revenue" value={formatNaira(data.stats.total_revenue)} icon={TrendingUp} gradient="from-rose-400 to-primary" />
            <StatCard label="Clients w/ Credits" value={data.stats.clients_with_credits} icon={Users} gradient="from-indigo-500 to-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Recent Transactions" padded={false}>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.recent_transactions.map((t) => (
                  <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.client ?? "—"}</p>
                      <p className="text-xs text-gray-500">{statusLabel(t.type)} · {formatDate(t.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.credits > 0 ? "+" : ""}{t.credits} cr</p>
                      {t.amount_paid != null && <p className="text-xs text-gray-500">{formatNaira(t.amount_paid)}</p>}
                    </div>
                  </div>
                ))}
                {data.recent_transactions.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">No transactions yet.</p>}
              </div>
            </Panel>

            <Panel title="Low Credit Clients" padded={false}>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.low_credit_clients.map((c) => (
                  <div key={c.client_id} className="px-6 py-3 flex items-center justify-between">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{c.client ?? "—"}</p>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{c.available_credits} cr</span>
                  </div>
                ))}
                {data.low_credit_clients.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">No clients running low.</p>}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
