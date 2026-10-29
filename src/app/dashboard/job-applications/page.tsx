"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Search, Star, UserCheck, XCircle } from "lucide-react";
import { JobApplicationFilters, useJobApplications } from "@/src/api/jobApplications";
import { formatDate, statusLabel } from "@/src/helpers/format";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";
import { JobApplicationStatus } from "@/src/types";

const STATUS_PILL: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  reviewing: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  shortlisted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  hired: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

function JobApplicationsContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [jobType, setJobType] = useState("");

  const filters: JobApplicationFilters = { page, search: search || undefined, status: status || undefined, job_type: jobType || undefined };
  const { data, isLoading, isFetching } = useJobApplications(filters);

  return (
    <div className="space-y-6">
      <DocumentTitle title="Job Applications" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Applications</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Riders, partners and staff who applied to join.</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Pending" value={data.stats.pending} icon={Clock} gradient="from-amber-400 to-orange-500" />
          <StatCard label="Reviewing" value={data.stats.reviewing} icon={Search} gradient="from-blue-500 to-blue-600" />
          <StatCard label="Shortlisted" value={data.stats.shortlisted} icon={Star} gradient="from-indigo-500 to-purple-600" />
          <StatCard label="Hired" value={data.stats.hired} icon={UserCheck} gradient="from-emerald-500 to-green-600" />
          <StatCard label="Rejected" value={data.stats.rejected} icon={XCircle} gradient="from-rose-400 to-primary" />
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search name, phone, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" value={jobType} onChange={(e) => { setJobType(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="dispatch_rider">Dispatch Rider</option>
            <option value="partner_rider">Partner Rider</option>
            <option value="foot_soldier">Foot Soldier</option>
            <option value="warehouse_staff">Warehouse Staff</option>
            <option value="customer_service">Customer Service</option>
          </select>
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Applicant", "Role", "Contact", "Experience", "Status", "Applied"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => router.push(`/dashboard/job-applications/${a.id}`)}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/job-applications/${a.id}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{a.full_name}</Link>
                      {a.is_partner && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary">Partner</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{a.formatted_job_type}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-gray-100">{a.phone}</p>
                      {a.email && <p className="text-xs text-gray-500">{a.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.experience_years ?? "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[a.status as JobApplicationStatus]}`}>{statusLabel(a.status)}</span></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No applications match these filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={setPage} />}
      </div>
    </div>
  );
}

export default function JobApplicationsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <JobApplicationsContent />
    </Suspense>
  );
}
