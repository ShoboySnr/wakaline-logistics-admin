"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { name: "Overview", href: "/dashboard/credits" },
  { name: "Plans", href: "/dashboard/credits/plans" },
  { name: "Packages", href: "/dashboard/credits/packages" },
  { name: "Settings", href: "/dashboard/credits/settings" },
];

export default function CreditTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.href === "/dashboard/credits" ? pathname === tab.href : pathname?.startsWith(tab.href);
        return (
          <Link key={tab.name} href={tab.href} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
