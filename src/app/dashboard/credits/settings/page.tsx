"use client";

import { useState } from "react";
import { useCreditSettings, useUpdateCreditSettings } from "@/src/api/credits";
import { statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Panel from "@/src/components/organisms/client/Panel";
import CreditTabs from "@/src/components/molecules/CreditTabs";
import { CreditSettingsData } from "@/src/types";

function SettingsForm({ data }: { data: CreditSettingsData }) {
  const notify = useNotify();
  const updateSettings = useUpdateCreditSettings();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const flat: Record<string, string> = {};
    data.groups.forEach((g) => g.settings.forEach((s) => { flat[s.key] = s.value == null ? "" : String(s.value); }));
    return flat;
  });

  const save = async () => {
    try { const res = await updateSettings.mutateAsync(values); notify.success(res.message); } catch (e) { notify.error(errorMessage(e)); }
  };

  return (
    <>
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
                  <input className="input" type={s.type === "integer" || s.type === "float" ? "number" : "text"} value={values[s.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
                )}
                {s.description && <p className="mt-1 text-xs text-gray-500">{s.description}</p>}
              </div>
            ))}
          </div>
        </Panel>
      ))}
      <div className="flex justify-end">
        <button onClick={save} disabled={updateSettings.isPending} className="btn-primary">{updateSettings.isPending ? "Saving..." : "Save settings"}</button>
      </div>
    </>
  );
}

export default function CreditSettingsPage() {
  const { data, isLoading } = useCreditSettings();

  return (
    <div className="space-y-6">
      <DocumentTitle title="Credit Settings" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Credits &amp; Plans</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Pricing, thresholds and credit rules.</p>
      </div>
      <CreditTabs />

      {isLoading || !data ? (
        <LoadingSpinner fullScreen={false} />
      ) : data.groups.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No credit settings configured.</div>
      ) : (
        <SettingsForm data={data} />
      )}
    </div>
  );
}
