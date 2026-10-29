"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useJobApplication, useUpdateApplicationStatus, useDeleteApplication } from "@/src/api/jobApplications";
import { formatDate, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Panel from "@/src/components/organisms/client/Panel";
import { JobApplicationGuarantor } from "@/src/types";

const STATUSES = ["pending", "reviewing", "shortlisted", "rejected", "hired"];

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 break-words whitespace-pre-line">{value}</dd>
    </div>
  );
}

export default function JobApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const notify = useNotify();
  const { data: app, isLoading } = useJobApplication(id);
  const updateStatus = useUpdateApplicationStatus(id);
  const deleteApp = useDeleteApplication();

  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [notesOverride, setNotesOverride] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (!app) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Application not found. <Link href="/dashboard/job-applications" className="text-primary hover:underline">Back</Link>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateStatus.mutateAsync({ status, admin_notes: notes });
      notify.success("Application updated");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this application?")) return;
    try {
      const res = await deleteApp.mutateAsync(app.id);
      notify.success(res.message);
      router.replace("/dashboard/job-applications");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const status = statusOverride ?? app.status;
  const notes = notesOverride ?? app.admin_notes ?? "";
  const guarantors = app.guarantors.filter((g: JobApplicationGuarantor) => g.full_name);

  return (
    <div className="space-y-6">
      <DocumentTitle title={app.full_name} />
      <Link href="/dashboard/job-applications" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Applications
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{app.full_name}</h1>
            {app.is_partner && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">Partner</span>}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{app.formatted_job_type}</p>
        </div>
        <button onClick={handleDelete} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Applicant">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Phone" value={app.phone} />
              <Info label="Email" value={app.email} />
              <Info label="Age" value={app.age} />
              <Info label="Experience" value={app.experience_years} />
              <Info label="Address" value={app.address} />
              <Info label="Availability" value={app.availability} />
              <Info label="License Number" value={app.license_number} />
              <Info label="Previous Work" value={app.previous_work} />
              <div className="sm:col-span-2"><Info label="Why Join" value={app.why_join} /></div>
            </dl>
          </Panel>

          {app.is_partner && (
            <Panel title="Partner Details">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Info label="Owns Vehicle" value={app.owns_vehicle === null ? null : app.owns_vehicle ? "Yes" : "No"} />
                <Info label="Vehicle Type" value={app.vehicle_type ? statusLabel(app.vehicle_type) : null} />
                <Info label="Plate Number" value={app.vehicle_registration} />
                <Info label="Has Smartphone" value={app.has_smartphone === null ? null : app.has_smartphone ? "Yes" : "No"} />
                <div className="sm:col-span-2"><Info label="Coverage Areas" value={app.coverage_areas} /></div>
              </dl>
            </Panel>
          )}

          {guarantors.length > 0 && (
            <Panel title="Guarantors" subtitle={`${guarantors.length} of 2 supplied`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guarantors.map((g) => (
                  <div key={g.index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Guarantor {g.index}</p>
                    <dl className="space-y-2">
                      <Info label="Name" value={g.full_name} />
                      <Info label="Phone" value={g.phone} />
                      <Info label="Relationship" value={g.relationship} />
                      <Info label="Occupation" value={g.occupation} />
                      <Info label="Address" value={g.residential_address} />
                    </dl>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Review">
            <label className="label">Status</label>
            <select className="input mb-4" value={status} onChange={(e) => setStatusOverride(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <label className="label">Admin Notes</label>
            <textarea rows={4} className="input mb-4" value={notes} onChange={(e) => setNotesOverride(e.target.value)} placeholder="Internal notes about this applicant" />
            <button onClick={handleSave} disabled={updateStatus.isPending} className="btn-primary w-full">
              {updateStatus.isPending ? "Saving..." : "Save review"}
            </button>
            {app.reviewed_by && (
              <p className="text-xs text-gray-500 mt-3">Last reviewed by {app.reviewed_by} on {formatDate(app.reviewed_at, true)}</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
