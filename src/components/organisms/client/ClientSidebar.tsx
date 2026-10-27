"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { useClientAction, useClientFormOptions } from "@/src/api/clients";
import { formatDate, formatNaira } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import { ClientDetail } from "@/src/types";
import Panel from "./Panel";

function useRun() {
  const notify = useNotify();
  return async (action: () => Promise<{ message?: string } | unknown>, fallback: string) => {
    try {
      const res = (await action()) as { message?: string } | undefined;
      notify.success(res?.message ?? fallback);
      return true;
    } catch (e) {
      notify.error(errorMessage(e));
      return false;
    }
  };
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={value} className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="btn-secondary px-3"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function ClientSidebar({ client }: { client: ClientDetail }) {
  const actions = useClientAction(client.id);
  const { data: options } = useClientFormOptions();
  const run = useRun();
  const [plan, setPlan] = useState({ subscription_plan_id: "", starts_at: new Date().toISOString().slice(0, 10), notes: "" });
  const [credit, setCredit] = useState({ type: "add" as "add" | "deduct", credits: "", reason: "" });

  const confirmRun = (message: string, action: () => Promise<unknown>, fallback: string) => {
    if (confirm(message)) run(action, fallback);
  };

  return (
    <div className="space-y-6">
      <Panel title="Email Verification">
        {client.email_verified_at ? (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm">
            <p className="font-semibold text-green-800 dark:text-green-300">Verified</p>
            <p className="text-xs text-gray-500">{formatDate(client.email_verified_at, true)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">This client hasn&apos;t verified their email. Verifying manually also credits the 2,000 signup bonus.</p>
            <button
              className="btn-primary w-full"
              disabled={actions.verifyEmail.isPending}
              onClick={() => confirmRun(`Manually verify ${client.name}'s email?`, () => actions.verifyEmail.mutateAsync(), "Email verified")}
            >
              Verify Email Manually
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Subscription Plan">
        {client.active_subscription ? (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 mb-4 text-sm">
            <p className="font-semibold text-green-800 dark:text-green-300">{client.active_subscription.plan_name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Credits: {client.active_subscription.credits_used.toLocaleString()} / {client.active_subscription.credits_allocated.toLocaleString()} used
            </p>
            {client.active_subscription.expires_at && <p className="text-xs text-gray-500">Expires: {formatDate(client.active_subscription.expires_at)}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No active subscription.</p>
        )}
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run(
              () => actions.subscribe.mutateAsync({ subscription_plan_id: Number(plan.subscription_plan_id), starts_at: plan.starts_at, notes: plan.notes || undefined }),
              "Subscription assigned",
            );
            if (ok) setPlan((prev) => ({ ...prev, subscription_plan_id: "", notes: "" }));
          }}
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{client.active_subscription ? "Change Subscription" : "Assign Subscription"}</p>
          <select required className="input" value={plan.subscription_plan_id} onChange={(e) => setPlan({ ...plan, subscription_plan_id: e.target.value })}>
            <option value="">Select plan</option>
            {options?.subscription_plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.credits.toLocaleString()} credits ({formatNaira(p.price)})
              </option>
            ))}
          </select>
          <input type="date" required className="input" value={plan.starts_at} onChange={(e) => setPlan({ ...plan, starts_at: e.target.value })} />
          <input className="input" placeholder="Notes (optional)" value={plan.notes} onChange={(e) => setPlan({ ...plan, notes: e.target.value })} />
          <button type="submit" disabled={actions.subscribe.isPending} className="btn-primary w-full">
            {actions.subscribe.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Assign Plan
          </button>
        </form>
      </Panel>

      <Panel title="Delivery Credits">
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          {[
            ["Available", client.credits.available, "text-green-700 bg-green-50 dark:bg-green-900/20"],
            ["Total", client.credits.total, "text-blue-700 bg-blue-50 dark:bg-blue-900/20"],
            ["Used", client.credits.used, "text-red-700 bg-red-50 dark:bg-red-900/20"],
          ].map(([label, value, tone]) => (
            <div key={label as string} className={`rounded-lg p-2 ${tone}`}>
              <p className="text-[11px] opacity-80">{label}</p>
              <p className="text-lg font-bold">{Number(value).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run(() => actions.credits.mutateAsync({ type: credit.type, credits: Number(credit.credits), reason: credit.reason }), "Credits updated");
            if (ok) setCredit({ ...credit, credits: "", reason: "" });
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["add", "deduct"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCredit({ ...credit, type })}
                className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                  credit.type === type
                    ? type === "add"
                      ? "bg-primary text-white border-primary"
                      : "bg-red-600 text-white border-red-600"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                }`}
              >
                {type === "add" ? "Add Credits" : "Deduct Credits"}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={credit.type === "deduct" ? client.credits.available : undefined}
            required
            className="input"
            placeholder="e.g. 10"
            value={credit.credits}
            onChange={(e) => setCredit({ ...credit, credits: e.target.value })}
          />
          <input required className="input" placeholder="Reason" value={credit.reason} onChange={(e) => setCredit({ ...credit, reason: e.target.value })} />
          <button type="submit" disabled={actions.credits.isPending} className={credit.type === "add" ? "btn-primary w-full" : "btn-secondary w-full text-red-600"}>
            {actions.credits.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {credit.type === "add" ? "Add Credits" : "Deduct Credits"}
          </button>
        </form>
      </Panel>

      <Panel title="Order Tracking" subtitle="Public link where the client can follow all their orders">
        {client.share_url ? (
          <div className="space-y-3">
            <CopyField value={client.share_url} />
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => run(() => actions.shareLink.mutateAsync("generate"), "New link generated")}>
                Regenerate
              </button>
              <button
                className="btn-secondary text-red-600"
                onClick={() => confirmRun("Disable this client's order tracking link?", () => actions.shareLink.mutateAsync("disable"), "Link disabled")}
              >
                Disable
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={() => run(() => actions.shareLink.mutateAsync("generate"), "Link generated")}>
            Enable Order Tracking
          </button>
        )}
      </Panel>

      <Panel title="Daily Remittance" subtitle="Track Pay-on-Delivery remittances for this client">
        <div className={`rounded-lg p-3 mb-3 text-sm ${client.pod_remittance_enabled ? "bg-primary/5 border border-primary/40" : "bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700"}`}>
          <p className={`font-semibold ${client.pod_remittance_enabled ? "text-primary" : "text-gray-600 dark:text-gray-300"}`}>
            POD Remittance: {client.pod_remittance_enabled ? "Enabled" : "Disabled"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {client.pod_remittance_enabled
              ? "This client appears in the Daily Remit popup and their cash orders and stock are tracked."
              : "Enable to include this client in Daily Remit tracking and stock records."}
          </p>
        </div>
        <button
          className={client.pod_remittance_enabled ? "btn-secondary w-full" : "btn-primary w-full"}
          disabled={actions.toggleRemittance.isPending}
          onClick={() =>
            client.pod_remittance_enabled
              ? confirmRun(`Disable daily remittance for ${client.name}?`, () => actions.toggleRemittance.mutateAsync(), "Daily remittance disabled")
              : run(() => actions.toggleRemittance.mutateAsync(), "Daily remittance enabled")
          }
        >
          {client.pod_remittance_enabled ? "Disable Daily Remittance" : "Enable Daily Remittance"}
        </button>
      </Panel>

      <Panel title="API Access" subtitle="Client's API key for external integrations">
        {client.api_enabled && client.api_key ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-xs space-y-1">
              <p className="font-semibold text-green-700">API Access: Enabled</p>
              {client.api_key_generated_at && <p className="text-gray-500">Generated: {formatDate(client.api_key_generated_at, true)}</p>}
              <p className="text-gray-500">Last used: {client.api_last_used_at ? formatDate(client.api_last_used_at, true) : "Never"}</p>
            </div>
            <CopyField value={client.api_key} />
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-secondary"
                onClick={() => confirmRun("Regenerate the API key? The old key stops working immediately.", () => actions.apiAccess.mutateAsync("regenerate"), "API key regenerated")}
              >
                Regenerate
              </button>
              <button
                className="btn-secondary text-red-600"
                onClick={() => confirmRun("Disable API access for this client?", () => actions.apiAccess.mutateAsync("disable"), "API access disabled")}
              >
                Disable
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn-primary w-full"
            disabled={actions.apiAccess.isPending}
            onClick={() => run(() => actions.apiAccess.mutateAsync(client.api_key ? "enable" : "generate"), "API access enabled")}
          >
            {client.api_key ? "Enable API Access" : "Generate API Key"}
          </button>
        )}
      </Panel>

      <Panel title="Bank Details">
        {client.bank_name || client.bank_account_number || client.bank_account_name ? (
          <dl className="space-y-2 text-sm">
            {[
              ["Bank", client.bank_name],
              ["Account Number", client.bank_account_number],
              ["Account Name", client.bank_account_name],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-gray-500">No bank details saved. Add them from Edit Client.</p>
        )}
      </Panel>

      <Panel title="Webhook">
        {client.webhook ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${client.webhook.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {client.webhook.is_active ? "Active" : "Inactive"}
              </span>
              <span className="text-xs text-gray-500">{client.webhook.sync_count ?? 0} deliveries</span>
            </div>
            {client.webhook.url && <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">{client.webhook.url}</p>}
            {client.webhook.last_error && <p className="text-xs text-red-600">Last error: {client.webhook.last_error}</p>}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {client.webhook.logs.map((log) => (
                <div key={log.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{log.action}</p>
                    <p className="text-[11px] text-gray-500">{formatDate(log.created_at, true)}</p>
                  </div>
                  <span className={`text-[11px] font-semibold ${log.status === "success" ? "text-green-600" : "text-red-600"}`}>{log.status}</span>
                </div>
              ))}
              {client.webhook.logs.length === 0 && <p className="py-2 text-xs text-gray-500">No deliveries yet.</p>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">The client hasn&apos;t configured a webhook.</p>
        )}
      </Panel>
    </div>
  );
}
