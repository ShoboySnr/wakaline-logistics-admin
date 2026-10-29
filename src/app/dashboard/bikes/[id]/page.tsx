"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Pencil, Trash2, UserCog } from "lucide-react";
import { useBike, useBikeFormOptions, useDeleteBike, useAssignBikeRider } from "@/src/api/bikes";
import { formatDate, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Panel from "@/src/components/organisms/client/Panel";
import { BikeDocument } from "@/src/types";

const STATUS_PILL: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const DOC_STATUS: Record<string, { label: string; className: string }> = {
  valid: { label: "Valid", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  expiring: { label: "Expiring", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  expired: { label: "Expired", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  none: { label: "Not set", className: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400" },
};

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 break-words">{value}</dd>
    </div>
  );
}

export default function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const notify = useNotify();
  const { data: bike, isLoading } = useBike(id);
  const { data: formOptions } = useBikeFormOptions();
  const deleteBike = useDeleteBike();
  const assignRider = useAssignBikeRider(id);

  if (isLoading) return <LoadingSpinner />;
  if (!bike) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Bike not found. <Link href="/dashboard/bikes" className="text-primary hover:underline">Back to bikes</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Delete this bike? This cannot be undone.")) return;
    try {
      const res = await deleteBike.mutateAsync(bike.id);
      notify.success(res.message);
      router.replace("/dashboard/bikes");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleAssign = async (value: string) => {
    try {
      await assignRider.mutateAsync(value ? Number(value) : null);
      notify.success(value ? "Rider assigned" : "Rider unassigned");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title={bike.bike_number} />
      <Link href="/dashboard/bikes" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Bikes
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{bike.bike_number}</h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[bike.status]}`}>{statusLabel(bike.status)}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono">{bike.plate_number}{(bike.brand || bike.model) ? ` · ${[bike.brand, bike.model].filter(Boolean).join(" ")}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/bikes/${bike.id}/edit`} className="btn-secondary">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Bike Information">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Brand" value={bike.brand} />
              <Info label="Model" value={bike.model} />
              <Info label="Color" value={bike.color} />
              <Info label="Year" value={bike.year} />
              <Info label="Engine Number" value={bike.engine_number} />
              <Info label="Chassis Number" value={bike.chassis_number} />
              <Info label="Last Maintenance" value={formatDate(bike.last_maintenance_date)} />
              <Info label="Next Maintenance" value={formatDate(bike.next_maintenance_date)} />
              <Info label="Notes" value={bike.notes} />
            </dl>
          </Panel>

          <Panel title="Documents">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {bike.documents.map((doc: BikeDocument) => {
                const badge = DOC_STATUS[doc.status] ?? DOC_STATUS.none;
                return (
                  <div key={doc.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {doc.status === "expired" ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.label}</p>
                        <p className="text-xs text-gray-500">{doc.expiry_date ? `Expires ${formatDate(doc.expiry_date)}` : "No expiry set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {bike.stickers.length > 0 && (
            <Panel title="Stickers & Permits">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {bike.stickers.map((sticker, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sticker.name}</p>
                      <p className="text-xs text-gray-500">{sticker.serial_number}{sticker.expiry_date ? ` · Expires ${formatDate(sticker.expiry_date)}` : ""}</p>
                    </div>
                    {sticker.url && <a href={sticker.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">View</a>}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Assigned Rider" subtitle={bike.assignment_date ? `Since ${formatDate(bike.assignment_date)}` : undefined}>
            <div className="flex items-center gap-2 mb-3">
              <UserCog className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{bike.assigned_rider ? bike.assigned_rider.name : "Unassigned"}</span>
            </div>
            <label className="label">Assign to rider</label>
            <select
              className="input"
              value={bike.assigned_rider?.id ?? ""}
              disabled={assignRider.isPending}
              onChange={(e) => handleAssign(e.target.value)}
            >
              <option value="">Unassigned</option>
              {formOptions?.riders.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.phone ? ` - ${r.phone}` : ""}</option>
              ))}
            </select>
          </Panel>

          <Panel title="Document Health">
            <div className="flex items-center gap-2 text-sm">
              {bike.has_expired_documents ? (
                <><AlertTriangle className="w-4 h-4 text-red-500" /> <span className="text-red-700 dark:text-red-400">Has expired documents</span></>
              ) : bike.has_expiring_documents ? (
                <><AlertTriangle className="w-4 h-4 text-amber-500" /> <span className="text-amber-700 dark:text-amber-400">Documents expiring soon</span></>
              ) : (
                <><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-green-700 dark:text-green-400">All documents valid</span></>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
