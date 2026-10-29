"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useDeletePlan, usePlans, useSavePlan } from "@/src/api/credits";
import { formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Modal from "@/src/components/atoms/Modal";
import CreditTabs from "@/src/components/molecules/CreditTabs";
import { CreditPlan } from "@/src/types";

const CYCLES = ["daily", "weekly", "monthly", "quarterly", "yearly", "one-time"];

interface PlanFormValues { name: string; description: string; credits: string; price: string; billing_cycle: string; validity_days: string; features_text: string; is_active: boolean; is_featured: boolean; sort_order: string }

function PlanModal({ plan, onClose }: { plan: CreditPlan | "new" | null; onClose: () => void }) {
  const notify = useNotify();
  const editing = plan && plan !== "new" ? plan : undefined;
  const savePlan = useSavePlan(editing?.id);
  const { register, handleSubmit, formState: { errors } } = useForm<PlanFormValues>({
    defaultValues: {
      name: editing?.name ?? "", description: editing?.description ?? "",
      credits: editing ? String(editing.credits) : "", price: editing ? String(editing.price) : "",
      billing_cycle: editing?.billing_cycle ?? "monthly", validity_days: editing?.validity_days != null ? String(editing.validity_days) : "",
      features_text: (editing?.features ?? []).join("\n"),
      is_active: editing?.is_active ?? true, is_featured: editing?.is_featured ?? false,
      sort_order: editing?.sort_order != null ? String(editing.sort_order) : "",
    },
  });

  const onSubmit = async (v: PlanFormValues) => {
    try {
      await savePlan.mutateAsync({
        name: v.name, description: v.description, credits: Number(v.credits), price: Number(v.price),
        billing_cycle: v.billing_cycle, validity_days: v.validity_days === "" ? null : Number(v.validity_days),
        features: v.features_text.split("\n").map((s) => s.trim()).filter(Boolean),
        is_active: v.is_active, is_featured: v.is_featured, sort_order: v.sort_order === "" ? null : Number(v.sort_order),
      });
      notify.success(editing ? "Plan updated" : "Plan created");
      onClose();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Modal open={plan !== null} onClose={onClose} title={editing ? "Edit Plan" : "New Plan"}
      footer={<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" form="plan-form" className="btn-primary" disabled={savePlan.isPending}>{savePlan.isPending ? "Saving..." : editing ? "Update" : "Create"}</button></div>}>
      <form id="plan-form" onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Name <span className="text-red-500">*</span></label><input className="input" {...register("name", { required: true })} />{errors.name && <p className="mt-1 text-xs text-red-600">Required</p>}</div>
        <div><label className="label">Credits <span className="text-red-500">*</span></label><input type="number" className="input" {...register("credits", { required: true })} /></div>
        <div><label className="label">Price (₦) <span className="text-red-500">*</span></label><input type="number" step="0.01" className="input" {...register("price", { required: true })} /></div>
        <div><label className="label">Billing Cycle</label><select className="input" {...register("billing_cycle")}>{CYCLES.map((c) => <option key={c} value={c}>{statusLabel(c)}</option>)}</select></div>
        <div><label className="label">Validity (days)</label><input type="number" className="input" {...register("validity_days")} /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={2} className="input" {...register("description")} /></div>
        <div className="sm:col-span-2"><label className="label">Features (one per line)</label><textarea rows={4} className="input" {...register("features_text")} /></div>
        <div><label className="label">Sort Order</label><input type="number" className="input" {...register("sort_order")} /></div>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" {...register("is_active")} /> Active</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" {...register("is_featured")} /> Featured</label>
        </div>
      </form>
    </Modal>
  );
}

export default function PlansPage() {
  const notify = useNotify();
  const { data, isLoading } = usePlans();
  const deletePlan = useDeletePlan();
  const [modal, setModal] = useState<CreditPlan | "new" | null>(null);

  const handleDelete = async (p: CreditPlan) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try { const res = await deletePlan.mutateAsync(p.id); notify.success(res.message); } catch (e) { notify.error(errorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title="Subscription Plans" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Credits &amp; Plans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Subscription plans clients can buy.</p>
        </div>
        <button onClick={() => setModal("new")} className="btn-primary"><Plus className="w-4 h-4" /> New Plan</button>
      </div>
      <CreditTabs />

      {isLoading ? <LoadingSpinner fullScreen={false} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((plan) => (
            <div key={plan.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                    {plan.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  </div>
                  <p className="text-xs text-gray-500">{statusLabel(plan.billing_cycle)}{plan.validity_days ? ` · ${plan.validity_days} days` : ""}</p>
                </div>
                {!plan.is_active && <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-500">Inactive</span>}
              </div>
              <p className="mt-3 text-2xl font-bold text-primary">{formatNaira(plan.price)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{plan.credits.toLocaleString()} credits</p>
              {plan.features.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400 flex-1">
                  {plan.features.map((f, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{f}</li>)}
                </ul>
              )}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setModal(plan)} className="btn-secondary flex-1"><Pencil className="w-4 h-4" /> Edit</button>
                <button onClick={() => handleDelete(plan)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {data?.length === 0 && <div className="card p-12 text-center text-gray-500 md:col-span-2 lg:col-span-3">No plans yet.</div>}
        </div>
      )}

      <PlanModal plan={modal} onClose={() => setModal(null)} />
    </div>
  );
}
