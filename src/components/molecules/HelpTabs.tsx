"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { name: "Tickets", href: "/dashboard/help" },
  { name: "FAQs", href: "/dashboard/help/faqs" },
];

export default function HelpTabs() {
  const pathname = usePathname();
  const isFaqs = pathname?.startsWith("/dashboard/help/faqs");
  return (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
      {TABS.map((tab) => {
        const active = tab.name === "FAQs" ? isFaqs : !isFaqs;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
