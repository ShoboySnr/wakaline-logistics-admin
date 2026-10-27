import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  href?: string;
}

export default function StatCard({ label, value, icon: Icon, gradient, href }: StatCardProps) {
  const body = (
    <>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </>
  );

  const className = `group relative bg-gradient-to-br ${gradient} rounded-2xl p-6 overflow-hidden transition-all hover:shadow-xl`;

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
