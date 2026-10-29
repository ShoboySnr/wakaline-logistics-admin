import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, BatchDiscountTier, SettingsData } from "../types";

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: () => request<ApiResponse<SettingsData>>("/settings").then((res) => res.data),
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => request<{ success: boolean; message: string }>("/settings", { method: "PUT", body: { settings } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
};

export const useUpdateBatchDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { enabled: boolean; tiers: BatchDiscountTier[] }) =>
      request<ApiResponse<{ enabled: boolean; tiers: BatchDiscountTier[] }>>("/settings/batch-discount", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
};

export const useClearCache = () =>
  useMutation({
    mutationFn: () => request<{ success: boolean; message: string }>("/settings/clear-cache", { method: "POST" }),
  });
