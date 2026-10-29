"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDeleteFaq, useFaqs, useSaveFaq } from "@/src/api/help";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Modal from "@/src/components/atoms/Modal";
import HelpTabs from "@/src/components/molecules/HelpTabs";
import { Faq } from "@/src/types";

interface FaqFormValues { question: string; answer: string; category: string; sort_order: string; is_active: boolean }

function FaqModal({ faq, categories, onClose }: { faq: Faq | "new" | null; categories: string[]; onClose: () => void }) {
  const notify = useNotify();
  const editing = faq && faq !== "new" ? faq : undefined;
  const saveFaq = useSaveFaq(editing?.id);
  const { register, handleSubmit, formState: { errors } } = useForm<FaqFormValues>({
    defaultValues: {
      question: editing?.question ?? "",
      answer: editing?.answer ?? "",
      category: editing?.category ?? "",
      sort_order: editing?.sort_order != null ? String(editing.sort_order) : "",
      is_active: editing?.is_active ?? true,
    },
  });

  const onSubmit = async (values: FaqFormValues) => {
    try {
      await saveFaq.mutateAsync({ ...values, sort_order: values.sort_order === "" ? null : Number(values.sort_order) });
      notify.success(editing ? "FAQ updated" : "FAQ created");
      onClose();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Modal
      open={faq !== null}
      onClose={onClose}
      title={editing ? "Edit FAQ" : "New FAQ"}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="faq-form" className="btn-primary" disabled={saveFaq.isPending}>{saveFaq.isPending ? "Saving..." : editing ? "Update" : "Create"}</button>
        </div>
      }
    >
      <form id="faq-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <label className="label">Question <span className="text-red-500">*</span></label>
          <input className="input" {...register("question", { required: true })} />
          {errors.question && <p className="mt-1 text-xs text-red-600">Question is required</p>}
        </div>
        <div>
          <label className="label">Answer <span className="text-red-500">*</span></label>
          <textarea rows={5} className="input" {...register("answer", { required: true })} />
          {errors.answer && <p className="mt-1 text-xs text-red-600">Answer is required</p>}
          <p className="mt-1 text-xs text-gray-500">HTML is supported.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category <span className="text-red-500">*</span></label>
            <input className="input" list="faq-categories" {...register("category", { required: true })} />
            <datalist id="faq-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input type="number" className="input" {...register("sort_order")} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" className="accent-primary" {...register("is_active")} /> Active (visible to clients)
        </label>
      </form>
    </Modal>
  );
}

export default function FaqsPage() {
  const notify = useNotify();
  const { data, isLoading } = useFaqs();
  const deleteFaq = useDeleteFaq();
  const [modal, setModal] = useState<Faq | "new" | null>(null);

  const handleDelete = async (faq: Faq) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const res = await deleteFaq.mutateAsync(faq.id);
      notify.success(res.message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const grouped = (data?.data ?? []).reduce<Record<string, Faq[]>>((acc, faq) => {
    (acc[faq.category] ??= []).push(faq);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <DocumentTitle title="FAQs" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Client support tickets and the FAQ knowledge base.</p>
        </div>
        <button onClick={() => setModal("new")} className="btn-primary"><Plus className="w-4 h-4" /> New FAQ</button>
      </div>

      <HelpTabs />

      {isLoading ? (
        <LoadingSpinner fullScreen={false} />
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No FAQs yet.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, faqs]) => (
            <div key={category} className="card overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <h2 className="text-sm font-semibold uppercase text-gray-500">{category}</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {faqs.map((faq) => (
                  <div key={faq.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{faq.question}</p>
                        {!faq.is_active && <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-100 text-gray-500">Hidden</span>}
                      </div>
                      <div className="faq-answer mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setModal(faq)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(faq)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FaqModal faq={modal} categories={data?.categories ?? []} onClose={() => setModal(null)} />
    </div>
  );
}
