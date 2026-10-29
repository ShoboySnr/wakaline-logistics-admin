"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useClearCache, useSettings, useUpdateBatchDiscount, useUpdateSettings } from "@/src/api/settings";
import { statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Panel from "@/src/components/organisms/client/Panel";
import { BatchDiscountTier } from "@/src/types";

export default function SettingsPage() {
  const notify = useNotify();
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateBatchDiscount = useUpdateBatchDiscount();
  const clearCache = useClearCache();

  const [values, setValues] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(false);
  const [tiers, setTiers] = useState<BatchDiscountTier[]>([]);

  useEffect(() => {
    if (!data) return;
    const flat: Record<string, string> = {};
    data.groups.forEach((group) => group.settings.forEach((s) => { flat[s.key] = s.value == null ? "" : String(s.value); }));
    setValues(flat);
    setEnabled(data.batch_discount.enabled);
    setTiers(data.batch_discount.tiers.length ? data.batch_discount.tiers : [{ min: 2, max: 6, percent: 10 }]);
  }, [data]);

  if (isLoading || !data) return <LoadingSpinner />;

  const saveSettings = async () => {
    try {
      const res = await updateSettings.mutateAsync(values);
      notify.success(res.message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const saveBatchDiscount = async () => {
    try {
      const res = await updateBatchDiscount.mutateAsync({ enabled, tiers });
      notify.success(res.message ?? "Saved");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await clearCache.mutateAsync();
      notify.success(res.message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const updateTier = (i: number, field: keyof BatchDiscountTier, value: string) => {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value === "" ? (field === "max" ? null : 0) : Number(value) } : t)));
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title="Settings" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">System configuration and pricing rules.</p>
        </div>
        <button onClick={handleClearCache} disabled={clearCache.isPending} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Clear cache
        </button>
      </div>

      {data.groups.map((group) => (
        <Panel key={group.group} title={statusLabel(group.group)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.settings.map((s) => (
              <div key={s.key}>
                <label className="label">{statusLabel(s.key)}</label>
                {s.type === "boolean" ? (
                  <select className="input" value={values[s.key] ?? "0"} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}>
                    <option value="1">Enabled</option>
                    <option value="0">Disabled</option>
                  </select>
                ) : (
                  <input
                    className="input"
                    type={s.type === "integer" || s.type === "float" ? "number" : "text"}
                    value={values[s.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                  />
                )}
                {s.description && <p className="mt-1 text-xs text-gray-500">{s.description}</p>}
              </div>
            ))}
          </div>
        </Panel>
      ))}

      {data.groups.length > 0 && (
        <div className="flex justify-end">
          <button onClick={saveSettings} disabled={updateSettings.isPending} className="btn-primary">
            {updateSettings.isPending ? "Saving..." : "Save settings"}
          </button>
        </div>
      )}

      <Panel
        title="Same-zone Batch Discount"
        subtitle="Discount repeat deliveries heading to a zone a rider is already visiting"
        actions={
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" className="accent-primary" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enabled
          </label>
        }
      >
        <div className="space-y-3">
          {tiers.map((tier, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="label">Min orders</label>
                <input type="number" min={2} className="input" value={tier.min} onChange={(e) => updateTier(i, "min", e.target.value)} />
              </div>
              <div>
                <label className="label">Max orders</label>
                <input type="number" min={2} className="input" placeholder="No limit" value={tier.max ?? ""} onChange={(e) => updateTier(i, "max", e.target.value)} />
              </div>
              <div>
                <label className="label">Discount %</label>
                <input type="number" min={0} max={100} className="input" value={tier.percent} onChange={(e) => updateTier(i, "percent", e.target.value)} />
              </div>
              <button onClick={() => setTiers((prev) => prev.filter((_, idx) => idx !== i))} className="p-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove band">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={() => setTiers((prev) => [...prev, { min: 2, max: null, percent: 10 }])} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <Plus className="w-4 h-4" /> Add band
          </button>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={saveBatchDiscount} disabled={updateBatchDiscount.isPending} className="btn-primary">
            {updateBatchDiscount.isPending ? "Saving..." : "Save batch discount"}
          </button>
        </div>
      </Panel>
    </div>
  );
}
