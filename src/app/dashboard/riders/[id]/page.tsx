"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, KeyRound, Link2, Link2Off, MapPin, Package, Pencil, Star, Trash2 } from "lucide-react";
import { useRider, useRiderAction, useDeleteRider } from "@/src/api/riders";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import StatusBadge from "@/src/components/atoms/StatusBadge";
import StatCard from "@/src/components/molecules/StatCard";
import Panel from "@/src/components/organisms/client/Panel";
import { RiderGuarantor } from "@/src/types";

const STATUS_PILL: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 break-words whitespace-pre-line">{value}</dd>
    </div>
  );
}

export default function RiderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const notify = useNotify();
  const { data: rider, isLoading } = useRider(id);
  const { shareLink, regenerateCode } = useRiderAction(id);
  const deleteRider = useDeleteRider();
  const [showGuarantors, setShowGuarantors] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (!rider) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Rider not found. <Link href="/dashboard/riders" className="text-primary hover:underline">Back to riders</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Delete this rider? This cannot be undone.")) return;
    try {
      const res = await deleteRider.mutateAsync(rider.id);
      notify.success(res.message);
      router.replace("/dashboard/riders");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleShare = async (action: "generate" | "disable") => {
    try {
      await shareLink.mutateAsync(action);
      notify.success(action === "generate" ? "Route link enabled" : "Route link disabled");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateCode.mutateAsync();
      notify.success("Access code regenerated");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    notify.success("Copied to clipboard");
  };

  const documents = Object.entries(rider.files).filter(([, url]) => url);
  const activeGuarantors = rider.guarantors.filter((g: RiderGuarantor) => g.full_name);

  return (
    <div className="space-y-6">
      <DocumentTitle title={rider.name} />
      <Link href="/dashboard/riders" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Riders
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          {rider.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rider.photo} alt={rider.name} className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
              {rider.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{rider.name}</h1>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[rider.status]}`}>{statusLabel(rider.status)}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {rider.rating != null ? Number(rider.rating).toFixed(2) : "No rating"} · {rider.total_deliveries} deliveries
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/riders/${rider.id}/edit`} className="btn-secondary">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={rider.stats.total_orders} icon={Package} gradient="from-blue-500 to-blue-600" />
        <StatCard label="Delivered" value={rider.stats.delivered_orders} icon={Package} gradient="from-emerald-500 to-green-600" />
        <StatCard label="Active Orders" value={rider.stats.active_orders} icon={Package} gradient="from-amber-400 to-orange-500" />
        <StatCard label="Rating" value={rider.rating != null ? Number(rider.rating).toFixed(2) : "—"} icon={Star} gradient="from-rose-400 to-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Rider Information">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Phone" value={rider.phone} />
              <Info label="Email" value={rider.email} />
              <Info label="Age" value={rider.age} />
              <Info label="Vehicle" value={rider.vehicle_type ? `${statusLabel(rider.vehicle_type)}${rider.vehicle_number ? ` · ${rider.vehicle_number}` : ""}` : null} />
              <Info label="License Number" value={rider.license_number} />
              <Info label="Address" value={rider.address} />
            </dl>
          </Panel>

          {activeGuarantors.length > 0 && (
            <Panel
              title="Guarantors"
              subtitle={`${activeGuarantors.length} of 2 supplied`}
              actions={
                <button onClick={() => setShowGuarantors((s) => !s)} className="text-sm text-primary hover:underline">
                  {showGuarantors ? "Hide" : "Show"} details
                </button>
              }
            >
              {showGuarantors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGuarantors.map((g) => (
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
              ) : (
                <p className="text-sm text-gray-500">{activeGuarantors.map((g) => g.full_name).join(", ")}</p>
              )}
            </Panel>
          )}

          <Panel title="Pending Deliveries" subtitle="Assigned orders not yet delivered">
            {rider.pending_orders.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No pending deliveries.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      {["Order", "Drop-off", "Price", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rider.pending_orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                        <td className="px-4 py-2 font-medium text-primary">{order.order_number}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{order.delivery_address}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{formatNaira(order.price)}</td>
                        <td className="px-4 py-2"><StatusBadge status={order.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {documents.length > 0 && (
            <Panel title="Documents">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {documents.map(([name, url]) => (
                  <a key={name} href={url ?? undefined} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm text-primary hover:bg-primary/5 hover:underline">
                    {statusLabel(name)}
                  </a>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Access Code" subtitle="Daily check-in code for the rider">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-2xl font-bold tracking-widest text-gray-900 dark:text-white">{rider.daily_code ?? "—"}</span>
              <button onClick={handleRegenerate} disabled={regenerateCode.isPending} className="btn-secondary">
                <KeyRound className="w-4 h-4" /> Regenerate
              </button>
            </div>
          </Panel>

          <Panel title="Route Share Link" subtitle="Public link showing this rider's live route">
            {rider.share_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input readOnly value={rider.share_url} className="input text-xs" />
                  <button onClick={() => copy(rider.share_url!)} className="btn-secondary shrink-0"><Copy className="w-4 h-4" /></button>
                </div>
                <button onClick={() => handleShare("disable")} disabled={shareLink.isPending} className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
                  <Link2Off className="w-4 h-4" /> Disable link
                </button>
              </div>
            ) : (
              <button onClick={() => handleShare("generate")} disabled={shareLink.isPending} className="btn-primary w-full">
                <Link2 className="w-4 h-4" /> Enable route link
              </button>
            )}
          </Panel>

          {(rider.current_latitude != null && rider.current_longitude != null) && (
            <Panel title="Last Known Location">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${rider.current_latitude},${rider.current_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <MapPin className="w-4 h-4" /> View on map
              </a>
              <p className="text-xs text-gray-500 mt-1">Updated {formatDate(rider.last_location_update, true)}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
