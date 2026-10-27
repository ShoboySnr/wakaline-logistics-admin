"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Plus, Save, X } from "lucide-react";
import { useClientAction } from "@/src/api/clients";
import { buildStockSummary } from "@/src/helpers/remittance";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import { ClientDetail } from "@/src/types";
import Panel from "./Panel";

interface Row {
  key: string;
  id?: number;
  product_name: string;
  quantity: string;
}

const toRows = (client: ClientDetail): Row[] =>
  client.stocks.length
    ? client.stocks.map((s) => ({ key: String(s.id), id: s.id, product_name: s.product_name, quantity: String(s.quantity) }))
    : [{ key: "new-0", product_name: "", quantity: "" }];

export default function StockSection({ client }: { client: ClientDetail }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(client));
  const [copied, setCopied] = useState(false);
  const { stocks } = useClientAction(client.id);
  const notify = useNotify();

  const update = (key: string, changes: Partial<Row>) => setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  const remove = (key: string) => setRows((prev) => (prev.length === 1 ? [{ key: `new-${Date.now()}`, product_name: "", quantity: "" }] : prev.filter((row) => row.key !== key)));
  const filled = rows.filter((row) => row.product_name.trim());

  const save = async () => {
    try {
      const res = await stocks.mutateAsync({
        stocks: filled.map((row) => ({ id: row.id, product_name: row.product_name.trim(), quantity: Number(row.quantity || 0) })),
      });
      setRows(toRows(res.data));
      notify.success("Stock records updated successfully.");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const copy = async () => {
    if (!filled.length) {
      notify.error("Add at least one product before copying.");
      return;
    }
    const name = `${client.name}${client.company_name ? ` (${client.company_name})` : ""}`;
    await navigator.clipboard.writeText(buildStockSummary(name, filled.map((row) => ({ product_name: row.product_name.trim(), quantity: Number(row.quantity || 0) }))));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Panel
      title="Stock Records"
      subtitle="Products held for this client and quantity left"
      actions={
        <button onClick={copy} className="btn-secondary py-1.5">
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Stock"}
        </button>
      }
    >
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-3">
            <input className="input" placeholder="Product name" value={row.product_name} onChange={(e) => update(row.key, { product_name: e.target.value })} />
            <input
              type="number"
              min={0}
              className="input w-28"
              placeholder="Qty left"
              value={row.quantity}
              onChange={(e) => update(row.key, { quantity: e.target.value })}
            />
            <button type="button" onClick={() => remove(row.key)} className="p-2 text-gray-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 mt-4">
        <button type="button" onClick={() => setRows((prev) => [...prev, { key: `new-${Date.now()}`, product_name: "", quantity: "" }])} className="btn-secondary">
          <Plus className="w-4 h-4" /> Add Product
        </button>
        <button type="button" onClick={save} disabled={stocks.isPending} className="btn-primary">
          {stocks.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Stock
        </button>
      </div>
    </Panel>
  );
}
