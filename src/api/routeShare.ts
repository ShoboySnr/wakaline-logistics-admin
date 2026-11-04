import { API_BASE_URL } from "../helpers/request";
import { OptimizedRoute, OrderStatus } from "../types";

const base = (riderId: string) => `${API_BASE_URL}/route-share/${riderId}`;

async function publicRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
  });
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : null;
  if (!res.ok) throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  return data as T;
}

export const validateDailyCode = (riderId: string, code: string) =>
  publicRequest<{ success: boolean; message: string; rider_name?: string }>(`${base(riderId)}/validate-code`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const fetchOptimizedRoute = (riderId: string, coords?: { lat: number; lng: number } | null) => {
  const q = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
  return publicRequest<{ success: boolean; data: OptimizedRoute }>(`${base(riderId)}/optimized-route${q}`).then((r) => r.data);
};

export const setRouteStatus = (riderId: string, orderId: number, status: OrderStatus) =>
  publicRequest<{ success: boolean }>(`${base(riderId)}/orders/${orderId}/route-status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });

export const markRouteCollected = (riderId: string, orderId: number) =>
  publicRequest<{ success: boolean }>(`${base(riderId)}/orders/${orderId}/payment-collected`, { method: "POST", body: JSON.stringify({}) });

export const pushRiderLocation = (riderId: string, lat: number, lng: number) =>
  publicRequest<{ success: boolean }>(`${base(riderId)}/location`, {
    method: "POST",
    body: JSON.stringify({ latitude: lat, longitude: lng }),
  });
