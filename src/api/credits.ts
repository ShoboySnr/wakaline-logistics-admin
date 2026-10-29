import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, CreditOverview, CreditPackage, CreditPlan, CreditSettingsData } from "../types";

export const useCreditOverview = () =>
  useQuery({ queryKey: ["credits", "overview"], queryFn: () => request<ApiResponse<CreditOverview>>("/credits/overview").then((r) => r.data) });

export const usePlans = () =>
  useQuery({ queryKey: ["credits", "plans"], queryFn: () => request<ApiResponse<CreditPlan[]>>("/credits/plans").then((r) => r.data) });

export const usePackages = () =>
  useQuery({ queryKey: ["credits", "packages"], queryFn: () => request<ApiResponse<CreditPackage[]>>("/credits/packages").then((r) => r.data) });

export const useCreditSettings = () =>
  useQuery({ queryKey: ["credits", "settings"], queryFn: () => request<ApiResponse<CreditSettingsData>>("/credits/settings").then((r) => r.data) });

const useCreditInvalidator = (keys: string[]) => {
  const queryClient = useQueryClient();
  return () => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: ["credits", k] }));
};

export const useSavePlan = (id?: number) => {
  const invalidate = useCreditInvalidator(["plans", "overview"]);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => request<ApiResponse<CreditPlan>>(id ? `/credits/plans/${id}` : "/credits/plans", { method: id ? "PUT" : "POST", body }),
    onSuccess: invalidate,
  });
};

export const useDeletePlan = () => {
  const invalidate = useCreditInvalidator(["plans", "overview"]);
  return useMutation({ mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/credits/plans/${id}`, { method: "DELETE" }), onSuccess: invalidate });
};

export const useSavePackage = (id?: number) => {
  const invalidate = useCreditInvalidator(["packages", "overview"]);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => request<ApiResponse<CreditPackage>>(id ? `/credits/packages/${id}` : "/credits/packages", { method: id ? "PUT" : "POST", body }),
    onSuccess: invalidate,
  });
};

export const useDeletePackage = () => {
  const invalidate = useCreditInvalidator(["packages", "overview"]);
  return useMutation({ mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/credits/packages/${id}`, { method: "DELETE" }), onSuccess: invalidate });
};

export const useUpdateCreditSettings = () => {
  const invalidate = useCreditInvalidator(["settings"]);
  return useMutation({ mutationFn: (settings: Record<string, unknown>) => request<{ success: boolean; message: string }>("/credits/settings", { method: "PUT", body: { settings } }), onSuccess: invalidate });
};
