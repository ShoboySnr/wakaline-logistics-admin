export default function Panel({
  title,
  subtitle,
  actions,
  children,
  padded = true,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
      <div className={padded ? "px-6 py-4" : ""}>{children}</div>
    </div>
  );
}
