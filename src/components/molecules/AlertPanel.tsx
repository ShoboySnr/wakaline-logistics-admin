import type { LucideIcon } from "lucide-react";

const TONES = {
  brand: "bg-primary/5 border-primary text-primary",
  red: "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-300",
  orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-400 text-orange-800 dark:text-orange-300",
};

interface AlertPanelProps {
  tone: keyof typeof TONES;
  icon: LucideIcon;
  title: string;
  summary: string;
  children: React.ReactNode;
}

export default function AlertPanel({ tone, icon: Icon, title, summary, children }: AlertPanelProps) {
  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${TONES[tone]}`}>
      <div className="flex">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="mb-2">{summary}</p>
            <ul className="list-disc list-inside space-y-1">{children}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}
