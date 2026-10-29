"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { useDeletePackage, usePackages, useSavePackage } from "@/src/api/credits";
import { formatNaira } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Modal from "@/src/components/atoms/Modal";
import CreditTabs from "@/src/components/molecules/CreditTabs";
import { CreditPackage } from "@/src/types";

interface PackageFormValues { name: string; description: string; credits: string; bonus_credits: string; price: string; validity_days: string; is_active: boolean; is_popular: boolean; sort_order: string }

function PackageModal({ pkg, onClose }: { pkg: CreditPackage | "new" | null; onClose: () => void }) {
  const notify = useNotify();
  const editing = pkg && pkg !== "new" ? pkg : undefined;
  const savePackage = useSavePackage(editing?.id);
  const { register, handleSubmit, formState: { errors } } = useForm<PackageFormValues>({
    defaultValues: {
      name: editing?.name ?? "", description: editing?.description ?? "",
      credits: editing ? String(editing.credits) : "", bonus_credits: editing?.bonus_credits != null ? String(editing.bonus_credits) : "",
      price: editing ? String(editing.price) : "", validity_days: editing?.validity_days != null ? String(editing.validity_days) : "",
      is_active: editing?.is_active ?? true, is_popular: editing?.is_popular ?? false,
      sort_order: editing?.sort_order != null ? String(editing.sort_order) : "",
    },
  });

  const onSubmit = async (v: PackageFormValues) => {
    try {
      await savePackage.mutateAsync({
        name: v.name, description: v.description, credits: Number(v.credits),
        bonus_credits: v.bonus_credits === "" ? 0 : Number(v.bonus_credits), price: Number(v.price),
        validity_days: v.validity_days === "" ? null : Number(v.validity_days),
        is_active: v.is_active, is_popular: v.is_popular, sort_order: v.sort_order === "" ? null : Number(v.sort_order),
      });
      notify.success(editing ? "Package updated" : "Package created");
      onClose();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Modal open={pkg !== null} onClose={onClose} title={editing ? "Edit Package" : "New Package"}
      footer={<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" form="pkg-form" className="btn-primary" disabled={savePackage.isPending}>{savePackage.isPending ? "Saving..." : editing ? "Update" : "Create"}</button></div>}>
      <form id="pkg-form" onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Name <span className="text-red-500">*</span></label><input className="input" {...register("name", { required: true })} />{errors.name && <p className="mt-1 text-xs text-red-600">Required</p>}</div>
        <div><label className="label">Credits <span className="text-red-500">*</span></label><input type="number" className="input" {...register("credits", { required: true })} /></div>
        <div><label className="label">Bonus Credits</label><input type="number" className="input" {...register("bonus_credits")} /></div>
        <div><label className="label">Price (₦) <span className="text-red-500">*</span></label><input type="number" step="0.01" className="input" {...register("price", { required: true })} /></div>
        <div><label className="label">Validity (days)</label><input type="number" className="input" {...register("validity_days")} /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={2} className="input" {...register("description")} /></div>
        <div><label className="label">Sort Order</label><input type="number" className="input" {...register("sort_order")} /></div>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" {...register("is_active")} /> Active</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" {...register("is_popular")} /> Popular</label>
        </div>
      </form>
    </Modal>
  );
}

export default function PackagesPage() {
  const notify = useNotify();
  const { data, isLoading } = usePackages();
  const deletePackage = useDeletePackage();
  const [modal, setModal] = useState<CreditPackage | "new" | null>(null);

  const handleDelete = async (p: CreditPackage) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try { const res = await deletePackage.mutateAsync(p.id); notify.success(res.message); } catch (e) { notify.error(errorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title="Credit Packages" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Credits &amp; Plans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">One-off credit packages clients can top up with.</p>
        </div>
        <button onClick={() => setModal("new")} className="btn-primary"><Plus className="w-4 h-4" /> New Package</button>
      </div>
      <CreditTabs />

      {isLoading ? <LoadingSpinner fullScreen={false} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((pkg) => (
            <div key={pkg.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
                  {pkg.is_popular && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary"><Zap className="w-3 h-3" /> Popular</span>}
                </div>
                {!pkg.is_active && <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-500">Inactive</span>}
              </div>
              <p className="mt-3 text-2xl font-bold text-primary">{formatNaira(pkg.price)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                {pkg.credits.toLocaleString()} credits{pkg.bonus_credits ? <span className="text-green-600 dark:text-green-400"> + {pkg.bonus_credits} bonus</span> : null}
                {pkg.validity_days ? ` · valid ${pkg.validity_days} days` : ""}
              </p>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setModal(pkg)} className="btn-secondary flex-1"><Pencil className="w-4 h-4" /> Edit</button>
                <button onClick={() => handleDelete(pkg)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {data?.length === 0 && <div className="card p-12 text-center text-gray-500 md:col-span-2 lg:col-span-3">No packages yet.</div>}
        </div>
      )}

      <PackageModal pkg={modal} onClose={() => setModal(null)} />
    </div>
  );
}
