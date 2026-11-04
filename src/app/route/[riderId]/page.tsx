"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, MapPin, Navigation, Package, RefreshCw } from "lucide-react";
import {
  fetchOptimizedRoute,
  markRouteCollected,
  pushRiderLocation,
  setRouteStatus,
  validateDailyCode,
} from "@/src/api/routeShare";
import { useConfirmPayment } from "@/src/api/orders";
import { useStore } from "@/src/store";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import RouteMap from "@/src/components/organisms/RouteMap";
import RouteStopList from "@/src/components/organisms/RouteStopList";
import { OptimizedRoute, OrderStatus, RouteStop } from "@/src/types";

const sessionKey = (id: string) => `wl-share-${id}`;
const cacheKey = (id: string) => `wl-share-route-${id}`;

export default function PublicRoutePage({ params }: { params: Promise<{ riderId: string }> }) {
  const { riderId } = use(params);
  const notify = useNotify();

  const token = useStore((s) => s.token);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isAdmin = mounted && !!token;

  const [authed, setAuthed] = useState(false);
  const [riderName, setRiderName] = useState<string>("");
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cached, setCached] = useState<OptimizedRoute | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey(riderId));
      if (raw) {
        const parsed = JSON.parse(raw) as { name?: string };
        setRiderName(parsed.name ?? "");
        setAuthed(true);
      }
    } catch {}
  }, [riderId]);

  const { data: route, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["share-route", riderId, coords],
    queryFn: () => fetchOptimizedRoute(riderId, coords),
    enabled: isAdmin || authed,
    refetchInterval: isAdmin ? 30_000 : false,
  });

  useEffect(() => {
    if (route) {
      try {
        localStorage.setItem(cacheKey(riderId), JSON.stringify(route));
      } catch {}
    }
  }, [route, riderId]);

  useEffect(() => {
    if (!route && isError) {
      try {
        const raw = localStorage.getItem(cacheKey(riderId));
        if (raw) setCached(JSON.parse(raw) as OptimizedRoute);
      } catch {}
    }
  }, [route, isError, riderId]);

  const data = route ?? cached;

  const liveLocation = useMemo(() => {
    if (data?.start) return { lat: data.start.lat, lng: data.start.lng };
    return null;
  }, [data]);

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);
    try {
      const res = await validateDailyCode(riderId, code.trim());
      try {
        sessionStorage.setItem(sessionKey(riderId), JSON.stringify({ name: res.rider_name }));
      } catch {}
      setRiderName(res.rider_name ?? "");
      setAuthed(true);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setValidating(false);
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) return notify.error("Location is not available on this device.");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        try {
          await pushRiderLocation(riderId, c.lat, c.lng);
        } catch {}
        notify.success("Route updated from your current location.");
      },
      () => notify.error("Could not read your location. Allow location access and try again."),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const runStatus = async (stop: RouteStop, status: OrderStatus) => {
    setBusy(`${stop.order_id}-${status}`);
    try {
      await setRouteStatus(riderId, stop.order_id, status);
      await refetch();
      notify.success(`${stop.order_number} marked ${status.replace(/_/g, " ")}.`);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(null);
    }
  };

  const runCollect = async (stop: RouteStop) => {
    setBusy(`${stop.order_id}-pay-collect`);
    try {
      await markRouteCollected(riderId, stop.order_id);
      await refetch();
      notify.success("Payment marked collected. The office will confirm it.");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(null);
    }
  };

  const confirmPayment = useConfirmPayment();
  const runConfirm = async (stop: RouteStop) => {
    setBusy(`${stop.order_id}-pay-confirm`);
    try {
      await confirmPayment.mutateAsync(stop.order_id);
      await refetch();
      notify.success("Payment confirmed.");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(null);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </main>
    );
  }

  if (!isAdmin && !authed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <DocumentTitle title="Your Route" />
        <div className="w-full max-w-sm card p-6 text-center">
          <Image src="/wakaline-logo.svg" alt="Waka Line Logistics" width={169} height={40} priority className="h-9 w-auto mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900">Enter today&apos;s code</h1>
          <p className="mt-1 text-sm text-gray-500">Use the 6-digit code from the office to see your deliveries.</p>
          <form onSubmit={submitCode} className="mt-4 space-y-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="••••••"
              className="input text-center tracking-[0.5em] text-lg"
              autoFocus
            />
            <button type="submit" disabled={code.length !== 6 || validating} className="btn-primary w-full">
              {validating ? "Checking…" : "View my route"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const summary = data?.summary;
  const stops = data?.stops ?? [];

  return (
    <main className="min-h-screen bg-gray-50">
      <DocumentTitle title="Your Route" />
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Image src="/wakaline-logo.svg" alt="Waka Line Logistics" width={169} height={40} priority className="h-7 w-auto" />
        <button onClick={() => refetch()} disabled={isFetching} className="btn-primary !px-3 !py-1.5 !text-xs">
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {isAdmin ? "Rider route" : riderName ? `${riderName}'s route` : "Your route"}
              </h1>
              {isAdmin ? (
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary">Admin view</span>
              ) : null}
            </div>
            {data?.start ? <p className="text-sm text-gray-500 mt-0.5">Starts from {data.start.label}</p> : null}
          </div>
          {isAdmin ? null : (
            <button onClick={shareLocation} className="btn-secondary !px-3 !py-1.5 !text-xs">
              <Navigation className="w-4 h-4" /> My location
            </button>
          )}
        </div>

        {isLoading && !cached ? (
          <LoadingSpinner />
        ) : (
          <>
            {cached && !route ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Showing your last saved route — you appear to be offline.
              </div>
            ) : null}

            {summary ? (
              <div className="grid grid-cols-3 gap-3">
                <Tile label="Stops" value={String(summary.stops)} />
                <Tile label="Distance" value={`${summary.total_km} km`} />
                <Tile label="Est. time" value={`${Math.floor(summary.total_minutes / 60)}h ${summary.total_minutes % 60}m`} />
              </div>
            ) : null}

            {stops.length === 0 ? (
              <div className="card p-8 text-center text-gray-600">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                No deliveries waiting for you right now. Pull refresh when the office assigns one.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <button onClick={() => setShowMap((v) => !v)} className="text-sm font-medium text-primary">
                    {showMap ? "Hide map" : "Show map"}
                  </button>
                  {data?.maps_url ? (
                    <a href={data.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      <MapPin className="w-3.5 h-3.5" /> Open in Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>

                {showMap ? (
                  <RouteMap stops={stops} start={data?.start ?? null} riderLocation={liveLocation} className="h-64 w-full" />
                ) : null}

                <RouteStopList
                  stops={stops}
                  busy={busy}
                  onStatus={runStatus}
                  onCollect={runCollect}
                  onConfirm={isAdmin ? runConfirm : undefined}
                  allowFail={isAdmin}
                />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}
