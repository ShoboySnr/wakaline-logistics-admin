import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationMeta } from "@/src/types";

export default function Pagination({ meta, onChange }: { meta: PaginationMeta; onChange: (page: number) => void }) {
  if (meta.last_page <= 1) return null;

  const from = (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-sm">
      <p className="text-gray-500 dark:text-gray-400">
        Showing {from}–{to} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <button className="btn-secondary px-3" disabled={meta.current_page <= 1} onClick={() => onChange(meta.current_page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-gray-600 dark:text-gray-300">
          {meta.current_page} / {meta.last_page}
        </span>
        <button className="btn-secondary px-3" disabled={meta.current_page >= meta.last_page} onClick={() => onChange(meta.current_page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
