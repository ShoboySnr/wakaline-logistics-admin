"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, CreditCard, FileText, Package, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useClient, useClientOrders, useDeleteClient } from "@/src/api/clients";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import StatusBadge from "@/src/components/atoms/StatusBadge";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";
import Panel from "@/src/components/organisms/client/Panel";
import RemittanceSection from "@/src/components/organisms/client/RemittanceSection";
import StockSection from "@/src/components/organisms/client/StockSection";
import InvoicesSection from "@/src/components/organisms/client/InvoicesSection";
import ClientSidebar from "@/src/components/organisms/client/ClientSidebar";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 break-words whitespace-pre-line">{value}</dd>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const notify = useNotify();
  const [ordersPage, setOrdersPage] = useState(1);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { data: client, isLoading, refetch } = useClient(id);
  const { data: orders } = useClientOrders(id, ordersPage);
  const deleteClient = useDeleteClient();

  if (isLoading) return <LoadingSpinner />;
  if (!client) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Client not found. <Link href="/dashboard/clients" className="text-primary hover:underline">Back to clients</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) return;
    try {
      const res = await deleteClient.mutateAsync(client.id);
      notify.success(res.message);
      router.replace("/dashboard/clients");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title={client.name} />
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${client.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
              {client.is_active ? "Active" : "Inactive"}
            </span>
            {client.pod_remittance_enabled && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">Daily remittance</span>}
          </div>
          {client.company_name && <p className="text-gray-600 dark:text-gray-400 mt-1">{client.company_name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/orders/new?client_id=${client.id}`} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Order
          </Link>
          <button onClick={() => setInvoiceOpen(true)} className="btn-secondary">
            <FileText className="w-4 h-4" /> Generate Invoice
          </button>
          <Link href={`/dashboard/clients/${client.id}/edit`} className="btn-secondary">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="btn-secondary text-red-600" title="Delete client">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Orders" value={client.stats.total_orders} icon={Package} gradient="from-blue-500 to-blue-600" />
        <StatCard label="Completed" value={client.stats.completed_orders} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
        <StatCard label="In Progress" value={client.stats.pending_orders} icon={Clock} gradient="from-amber-500 to-orange-600" />
        <StatCard label="Revenue" value={formatNaira(client.stats.total_revenue)} icon={Wallet} gradient="from-rose-400 to-primary" />
        <StatCard label="Credits" value={client.credits.available.toLocaleString()} icon={CreditCard} gradient="from-violet-500 to-fuchsia-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Contact Information">
              <dl className="space-y-3">
                <Info label="Contact Person" value={client.contact_person} />
                <Info label="Phone" value={client.phone} />
                <Info label="Alternate Phone" value={client.alternate_phone} />
                <Info label="Email" value={client.email} />
                <Info label="Alternate Email" value={client.alternate_email} />
                <Info label="Website" value={client.website} />
                <Info label="Last Login" value={client.last_login_at ? formatDate(client.last_login_at, true) : null} />
              </dl>
            </Panel>
            <Panel title="Business & Address">
              <dl className="space-y-3">
                <Info label="Pickup Address" value={client.pickup_address} />
                <Info label="Business Address" value={client.business_address} />
                <Info label="City / State" value={[client.city, client.state].filter(Boolean).join(", ")} />
                <Info label="Business Type" value={client.business_type} />
                <Info label="Tax ID" value={client.tax_id} />
                <Info label="Payment Terms" value={client.payment_terms ? statusLabel(client.payment_terms.replace("credit_", "net_")) : null} />
                <Info label="Credit Limit" value={client.credit_limit !== null ? formatNaira(client.credit_limit) : null} />
                <Info label="Onboarded" value={client.onboarded_date ? formatDate(client.onboarded_date) : null} />
              </dl>
            </Panel>
          </div>

          {(client.notes || client.special_instructions || Object.keys(client.zone_rates).length > 0) && (
            <Panel title="Additional Information">
              <dl className="space-y-3">
                <Info label="Internal Notes" value={client.notes} />
                <Info label="Special Instructions" value={client.special_instructions} />
                {Object.keys(client.zone_rates).length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-1">Zone Rates</dt>
                    <dd className="flex flex-wrap gap-2">
                      {Object.entries(client.zone_rates).map(([zone, rate]) => (
                        <span key={zone} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                          {zone}: {formatNaira(rate)}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </Panel>
          )}

          <Panel title="Orders" padded={false} subtitle={orders ? `${orders.meta.total} total` : undefined}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    {["Order #", "Delivery", "Price", "Status", "Created"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {orders?.data.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-6 py-3 font-medium">
                        <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">#{order.order_number}</Link>
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">{order.delivery_address}</td>
                      <td className="px-6 py-3 whitespace-nowrap">{formatNaira(order.price)}</td>
                      <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                  {orders?.data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No orders yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {orders && <Pagination meta={orders.meta} onChange={setOrdersPage} />}
          </Panel>

          {client.remittance && <RemittanceSection data={client.remittance} onChanged={() => refetch()} />}
          {client.pod_remittance_enabled && <StockSection key={client.stocks.map((s) => `${s.id}:${s.quantity}`).join(",")} client={client} />}
          <InvoicesSection client={client} open={invoiceOpen} onOpenChange={setInvoiceOpen} />
        </div>

        <ClientSidebar client={client} />
      </div>
    </div>
  );
}
