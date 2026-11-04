"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Crosshair,
  ExternalLink,
  Package,
  RefreshCw,
} from "lucide-react";
import { useRider, useRiderLocation, useRiderRoute } from "@/src/api/riders";
import { useConfirmPayment, useMarkPaymentCollected, useSetOrderStatus } from "@/src/api/orders";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import RouteMap from "@/src/components/organisms/RouteMap";
import RouteStopList from "@/src/components/organisms/RouteStopList";
import { OptimizedRoute, OrderStatus, RouteStop } from "@/src/types";

const cacheKey = (id: string) => `wl-route-${id}`;

export default function RiderRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const notify = useNotify();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cached, setCached] = useState<OptimizedRoute | null>(null);

  const { data: rider } = useRider(id);
  const { data: route, isLoading, isError, refetch, isFetching } = useRiderRoute(id, coords);
  const { data: location } = useRiderLocation(id);

  const setStatus = useSetOrderStatus();
  const collectPayment = useMarkPaymentCollected();
  const confirmPayment = useConfirmPayment();

  useEffect(() => {
    if (route) {
      try {
        localStorage.setItem(cacheKey(id), JSON.stringify(route));
      } catch {}
    }
  }, [route, id]);

  useEffect(() => {
    if (!route && isError) {
      try {
        const raw = localStorage.getItem(cacheKey(id));
        if (raw) setCached(JSON.parse(raw) as OptimizedRoute);
      } catch {}
    }
  }, [route, isError, id]);

  const data = route ?? cached;

  const liveLocation = useMemo(() => {
    if (location?.current_latitude != null && location?.current_longitude != null) {
      return { lat: location.current_latitude, lng: location.current_longitude };
    }
    if (data?.start) return { lat: data.start.lat, lng: data.start.lng };
    return null;
  }, [location, data]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return notify.error("Location is not available on this device.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        notify.success("Recalculating route from your current location.");
      },
      () => notify.error("Could not read your location. Allow location access and try again."),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const runStatus = async (stop: RouteStop, status: OrderStatus) => {
    setBusy(`${stop.order_id}-${status}`);
    try {
      await setStatus.mutateAsync({ id: stop.order_id, status });
      notify.success(`${stop.order_number} marked ${status.replace(/_/g, " ")}.`);
    } catch (e) {
      notify.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const runCollect = async (stop: RouteStop) => {
    setBusy(`${stop.order_id}-pay-collect`);
    try {
      await collectPayment.mutateAsync(stop.order_id);
      notify.success("Payment marked collected.");
    } catch (e) {
      notify.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const runConfirm = async (stop: RouteStop) => {
    setBusy(`${stop.order_id}-pay-confirm`);
    try {
      await confirmPayment.mutateAsync(stop.order_id);
      notify.success("Payment confirmed.");
    } catch (e) {
      notify.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (isLoading && !cached) return <LoadingSpinner />;

  const summary = data?.summary;
  const stops = data?.stops ?? [];

  return (
    <div className="space-y-5">
      <DocumentTitle title={`Route · ${rider?.name ?? "Rider"}`} />

      <Link href={`/dashboard/riders/${id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Rider
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Optimized Route</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {rider?.name}
            {data?.start ? <> · starts from <span className="font-medium">{data.start.label}</span></> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={useMyLocation} className="btn-secondary">
            <Crosshair className="w-4 h-4" /> Use my location
          </button>
          <button onClick={() => refetch()} disabled={isFetching} className="btn-primary">
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Re-optimize
          </button>
        </div>
      </div>

      {cached && !route ? (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" /> Showing the last saved route — the live data could not be reached.
        </div>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SummaryTile label="Stops" value={String(summary.stops)} />
          <SummaryTile label="Distance" value={`${summary.total_km} km`} />
          <SummaryTile label="Est. time" value={`${Math.floor(summary.total_minutes / 60)}h ${summary.total_minutes % 60}m`} />
          <SummaryTile label="At risk" value={String(summary.at_risk)} tone={summary.at_risk ? "amber" : undefined} />
          <SummaryTile label="Late" value={String(summary.late)} tone={summary.late ? "red" : undefined} />
        </div>
      ) : null}

      {stops.length === 0 ? (
        <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
          <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          No pending deliveries for this rider right now.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => setShowMap((v) => !v)} className="text-sm font-medium text-primary hover:underline">
              {showMap ? "Hide map" : "Show live map"}
            </button>
            {data?.maps_url ? (
              <a href={data.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Open full route in Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>

          {showMap ? (
            <RouteMap stops={stops} start={data?.start ?? null} riderLocation={liveLocation} className="h-72 sm:h-96 w-full" />
          ) : null}

          <RouteStopList stops={stops} busy={busy} onStatus={runStatus} onCollect={runCollect} onConfirm={runConfirm} />
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: "amber" | "red" }) {
  const toneClass =
    tone === "red"
      ? "text-red-600 dark:text-red-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-gray-900 dark:text-white";
  return (
    <div className="card p-3 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
