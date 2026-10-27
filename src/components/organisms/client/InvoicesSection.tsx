"use client";

import { useMemo, useState } from "react";
import { Download, Eye, FileText, Loader2, Trash2 } from "lucide-react";
import { useCreateInvoice, useDeleteInvoice } from "@/src/api/clients";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage, openFile } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import { ClientDetail } from "@/src/types";
import Modal from "../../atoms/Modal";
import StatusBadge from "../../atoms/StatusBadge";
import Panel from "./Panel";

const today = () => new Date().toISOString().slice(0, 10);

export default function InvoicesSection({ client, open, onOpenChange }: { client: ClientDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const notify = useNotify();
  const createInvoice = useCreateInvoice(client.id);
  const deleteInvoice = useDeleteInvoice(client.id);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [hideInvoiced, setHideInvoiced] = useState(false);
  const [form, setForm] = useState({
    invoice_date: today(),
    due_date: "",
    discount_percent: "0",
    tax_percent: "0",
    deduction_amount: "0",
    deduction_label: "",
    notes: "",
    payment_terms: "",
  });

  const visibleOrders = useMemo(
    () =>
      client.invoiceable_orders.filter((order) => {
        if (status && order.status !== status) return false;
        if (hideInvoiced && order.invoiced) return false;
        const haystack = `${order.order_number} ${order.pickup_address} ${order.delivery_address}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [client.invoiceable_orders, status, hideInvoiced, search],
  );

  const subtotal = client.invoiceable_orders.filter((o) => selected.includes(o.id)).reduce((sum, o) => sum + o.price, 0);
  const discount = (subtotal * Number(form.discount_percent || 0)) / 100;
  const tax = ((subtotal - discount) * Number(form.tax_percent || 0)) / 100;
  const total = subtotal - discount + tax - Number(form.deduction_amount || 0);

  const toggle = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const open$ = async (path: string, filename?: string) => {
    try {
      await openFile(path, filename);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const generate = async (action: "preview" | "download") => {
    if (!selected.length) {
      notify.error("Select at least one order to invoice.");
      return;
    }
    try {
      const res = await createInvoice.mutateAsync({ ...form, due_date: form.due_date || null, order_ids: selected });
      notify.success(res.message ?? "Invoice generated");
      onOpenChange(false);
      setSelected([]);
      await open$(`/invoices/${res.data.id}/${action}`, action === "download" ? `${res.data.invoice_number}.pdf` : undefined);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const remove = async (id: number, number: string) => {
    if (!confirm(`Delete ${number}? The orders themselves are not affected.`)) return;
    try {
      const res = await deleteInvoice.mutateAsync(id);
      notify.success(res.message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={form[key]} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} {...props} />
    </div>
  );

  return (
    <>
      <Panel
        title="Invoices"
        padded={false}
        subtitle={`${client.invoices.length} generated`}
        actions={
          <button onClick={() => onOpenChange(true)} className="btn-primary py-1.5">
            <FileText className="w-4 h-4" /> Generate Invoice
          </button>
        }
      >
        {client.invoices.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">No invoices generated for this client yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Invoice", "Date", "Orders", "Total", ""].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {client.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{invoice.invoice_number}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(invoice.invoice_date)}</td>
                    <td className="px-6 py-3 text-gray-500">{invoice.orders_count}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900 dark:text-gray-100">{formatNaira(invoice.total)}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => open$(`/invoices/${invoice.id}/preview`)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => open$(`/invoices/${invoice.id}/download`, `${invoice.invoice_number}.pdf`)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(invoice.id, invoice.invoice_number)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => onOpenChange(false)}
        title="Generate Invoice"
        subtitle={client.company_name || client.name}
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {selected.length} selected · Subtotal {formatNaira(subtotal)} · <span className="font-semibold text-gray-900 dark:text-white">Total {formatNaira(total)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => generate("preview")} disabled={createInvoice.isPending} className="btn-secondary">
                {createInvoice.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Preview
              </button>
              <button onClick={() => generate("download")} disabled={createInvoice.isPending} className="btn-primary">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        }
      >
        <div className="px-6 py-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {field("invoice_date", "Invoice date", { type: "date" })}
            {field("due_date", "Due date", { type: "date" })}
            {field("discount_percent", "Discount %", { type: "number", min: 0, max: 100, step: "0.01" })}
            {field("tax_percent", "VAT %", { type: "number", min: 0, max: 100, step: "0.01" })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field("deduction_amount", "Deduction (₦)", { type: "number", min: 0, step: "0.01" })}
            <div className="md:col-span-2">{field("deduction_label", "Deduction label", { placeholder: "e.g. Less: POD cash held on your behalf", maxLength: 120 })}</div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select orders</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input className="input py-1.5 w-56" placeholder="Filter by order no. or address" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="input py-1.5 w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  {["pending", "confirmed", "in_transit", "delivered", "cancelled"].map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <input type="checkbox" className="accent-primary" checked={hideInvoiced} onChange={(e) => setHideInvoiced(e.target.checked)} />
                  Hide already invoiced
                </label>
                <button type="button" className="text-primary hover:underline" onClick={() => setSelected((prev) => [...new Set([...prev, ...visibleOrders.map((o) => o.id)])])}>
                  Select all
                </button>
                <button type="button" className="text-gray-500 hover:underline" onClick={() => setSelected([])}>Clear</button>
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-72 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 w-10" />
                    {["Order", "Date", "Status", "Route", "Amount"].map((h) => (
                      <th key={h} className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase ${h === "Amount" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {visibleOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => toggle(order.id)}>
                      <td className="px-3 py-2">
                        <input type="checkbox" className="accent-primary" checked={selected.includes(order.id)} readOnly />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                        {order.order_number}
                        {order.invoiced && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">invoiced</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{formatDate(order.date)}</td>
                      <td className="px-3 py-2"><StatusBadge status={order.status} /></td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300 max-w-xs truncate">{order.pickup_address} → {order.delivery_address}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{formatNaira(order.price)}</td>
                    </tr>
                  ))}
                  {visibleOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No orders to show</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Notes</label>
              <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
            <div>
              <label className="label">Payment terms</label>
              <textarea rows={2} className="input" value={form.payment_terms} onChange={(e) => setForm((prev) => ({ ...prev, payment_terms: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
