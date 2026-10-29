import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, Order, PaginationMeta, RiderDetail, RiderFormOptions, RiderListResponse } from "../types";

export interface RiderFilters {
  page?: number;
  search?: string;
  status?: string;
}

type RiderResponse = ApiResponse<RiderDetail> & { message?: string };

export const useRiders = (filters: RiderFilters) =>
  useQuery({
    queryKey: ["riders", filters],
    queryFn: () => request<RiderListResponse>("/riders", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useRider = (id: number | string) =>
  useQuery({
    queryKey: ["riders", "detail", String(id)],
    queryFn: () => request<RiderResponse>(`/riders/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useRiderOrders = (id: number | string, page: number) =>
  useQuery({
    queryKey: ["riders", "detail", String(id), "orders", page],
    queryFn: () => request<{ success: boolean; data: Order[]; meta: PaginationMeta }>(`/riders/${id}/orders`, { query: { page } }),
    placeholderData: keepPreviousData,
  });

export const useRiderFormOptions = () =>
  useQuery({
    queryKey: ["riders", "form-options"],
    queryFn: () => request<ApiResponse<RiderFormOptions>>("/riders/form-options").then((res) => res.data),
    staleTime: 60_000,
  });

export const useSaveRider = (id?: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) =>
      request<RiderResponse>(id ? `/riders/${id}` : "/riders", { method: "POST", body: payload }).then((res) => res.data),
    onSuccess: (data) => {
      if (data && id) queryClient.setQueryData(["riders", "detail", String(id)], data);
      queryClient.invalidateQueries({ queryKey: ["riders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "form-options"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteRider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/riders/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["riders"] }),
  });
};

export const useRiderAction = (id: number | string) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["riders", "detail", String(id)] });

  return {
    shareLink: useMutation({
      mutationFn: (action: "generate" | "disable") =>
        request<ApiResponse<{ share_url: string | null }>>(`/riders/${id}/share-link`, { method: "POST", body: { action } }),
      onSuccess: invalidate,
    }),
    regenerateCode: useMutation({
      mutationFn: () => request<ApiResponse<{ daily_code: string }>>(`/riders/${id}/regenerate-code`, { method: "POST" }),
      onSuccess: invalidate,
    }),
  };
};
