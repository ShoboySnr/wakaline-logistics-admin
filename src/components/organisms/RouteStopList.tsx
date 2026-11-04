"use client";

import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Navigation,
  Phone,
  Wallet,
} from "lucide-react";
import { formatNaira } from "@/src/helpers/format";
import { OrderStatus, RouteStop } from "@/src/types";

const DEADLINE_BADGE: Record<string, string> = {
  on_time: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  at_risk: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  late: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const waHref = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, "").replace(/^0/, "234")}`;
const navHref = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

function statusActions(stop: RouteStop, allowFail: boolean): { label: string; status: OrderStatus; klass: string }[] {
  if (stop.type === "pickup") {
    return [{ label: "Mark picked up", status: "picked_up", klass: "btn-primary" }];
  }
  const actions: { label: string; status: OrderStatus; klass: string }[] = [];
  if (stop.status !== "in_transit" && stop.status !== "arrived_at_dropoff") {
    actions.push({ label: "Start delivery", status: "in_transit", klass: "btn-secondary" });
  }
  actions.push({ label: "Mark delivered", status: "delivered", klass: "btn-primary" });
  if (allowFail) {
    actions.push({ label: "Mark failed", status: "failed", klass: "btn-danger" });
  }
  return actions;
}

interface RouteStopListProps {
  stops: RouteStop[];
  busy: string | null;
  onStatus: (stop: RouteStop, status: OrderStatus) => void;
  onCollect: (stop: RouteStop) => void;
  onConfirm?: (stop: RouteStop) => void;
  allowFail?: boolean;
  showNavigate?: boolean;
}

export default function RouteStopList({ stops, busy, onStatus, onCollect, onConfirm, allowFail = true, showNavigate = true }: RouteStopListProps) {
  return (
    <ol className="space-y-3">
      {stops.map((stop) => {
        const isPickup = stop.type === "pickup";
        const isCash = (stop.payment_method ?? "").toLowerCase() === "cash";
        return (
          <li key={`${stop.order_id}-${stop.type}`} className="card p-4">
            <div className="flex items-start gap-3">
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${isPickup ? "bg-gray-500" : "bg-primary"}`}>
                {stop.seq}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${isPickup ? "text-gray-500" : "text-primary"}`}>
                    {isPickup ? "Pickup" : "Drop-off"}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{stop.order_number}</span>
                  {stop.client_name ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">· {stop.client_name}</span>
                  ) : null}
                  {PRIORITY_BADGE[stop.priority_level] ? (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${PRIORITY_BADGE[stop.priority_level]}`}>
                      {stop.priority_level}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200 break-words">{stop.address}</p>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> ETA {stop.eta_label}
                  </span>
                  <span>{stop.leg_km} km · {stop.leg_minutes} min</span>
                  {stop.deadline_label ? (
                    <span className={`px-2 py-0.5 rounded-full font-medium ${DEADLINE_BADGE[stop.deadline_status] ?? ""}`}>
                      Due {stop.deadline_label}
                      {stop.deadline_status === "late" ? " · LATE" : stop.deadline_status === "at_risk" ? " · at risk" : ""}
                    </span>
                  ) : null}
                </div>

                {(stop.item_description || stop.quantity || stop.price != null) && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    {stop.item_description ? <span>{stop.item_description}</span> : null}
                    {stop.quantity ? <span> · Qty {stop.quantity}</span> : null}
                    {stop.price != null ? (
                      <span className="inline-flex items-center gap-1 ml-1 font-medium text-gray-800 dark:text-gray-100">
                        <Wallet className="w-3.5 h-3.5" />
                        {isCash ? `Collect ${formatNaira(stop.price)}` : formatNaira(stop.price)}
                      </span>
                    ) : null}
                  </div>
                )}

                {stop.contact || stop.phone ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {stop.contact ? <span className="text-xs text-gray-600 dark:text-gray-300">{stop.contact}</span> : null}
                    {stop.phone ? (
                      <>
                        <a href={telHref(stop.phone)} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                        <a href={waHref(stop.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-green-100 dark:bg-green-900/40 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </>
                    ) : null}
                    {showNavigate ? (
                      <a href={navHref(stop.lat, stop.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <Navigation className="w-3.5 h-3.5" /> Navigate
                      </a>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {statusActions(stop, allowFail).map((a) => (
                    <button
                      key={a.status}
                      onClick={() => onStatus(stop, a.status)}
                      disabled={busy !== null}
                      className={`${a.klass} !px-3 !py-1.5 !text-xs`}
                    >
                      {busy === `${stop.order_id}-${a.status}` ? "…" : a.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2">
                  {stop.payment_confirmed_at ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
                      <CheckCircle2 className="w-4 h-4" /> Payment confirmed
                    </span>
                  ) : stop.payment_collected_at ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                        <Wallet className="w-4 h-4" /> Collected — awaiting confirmation
                      </span>
                      {onConfirm ? (
                        <button onClick={() => onConfirm(stop)} disabled={busy !== null} className="btn-secondary !px-3 !py-1.5 !text-xs">
                          {busy === `${stop.order_id}-pay-confirm` ? "…" : "Confirm payment"}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <button onClick={() => onCollect(stop)} disabled={busy !== null} className="btn-secondary !px-3 !py-1.5 !text-xs">
                      {busy === `${stop.order_id}-pay-collect` ? "…" : "Confirm payment collected"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
