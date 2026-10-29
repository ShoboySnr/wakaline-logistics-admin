import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationMeta } from "@/src/types";

/**
 * Builds the page list with ellipses: always the first and last page, the
 * current page with one neighbour each side, and "…" standing in for any gap.
 * e.g. 1 … 4 5 6 … 20
 */
function pageItems(current: number, last: number): (number | "…")[] {
  const siblings = 1;
  const pages = new Set<number>([1, last]);
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= last) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | "…")[] = [];
  let previous = 0;

  for (const page of sorted) {
    if (page - previous > 1) items.push("…");
    items.push(page);
    previous = page;
  }

  return items;
}

export default function Pagination({ meta, onChange }: { meta: PaginationMeta; onChange: (page: number) => void }) {
  if (meta.last_page <= 1) return null;

  const from = (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);
  const items = pageItems(meta.current_page, meta.last_page);

  const arrow = "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-sm">
      <p className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
        Showing {from}–{to} of {meta.total}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          className={arrow}
          disabled={meta.current_page <= 1}
          onClick={() => onChange(meta.current_page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {items.map((item, i) =>
          item === "…" ? (
            <span key={`gap-${i}`} className="inline-flex items-center justify-center w-9 h-9 text-gray-400 select-none">…</span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === meta.current_page ? "page" : undefined}
              onClick={() => onChange(item)}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                item === meta.current_page
                  ? "bg-primary text-white"
                  : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          className={arrow}
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onChange(meta.current_page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
