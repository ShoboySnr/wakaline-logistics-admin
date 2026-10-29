import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, BikeDetail, BikeFormOptions, BikeListResponse } from "../types";

export interface BikeFilters {
  page?: number;
  search?: string;
  status?: string;
  expiring?: string;
  expired?: string;
}

type BikeResponse = ApiResponse<BikeDetail> & { message?: string };

export const useBikes = (filters: BikeFilters) =>
  useQuery({
    queryKey: ["bikes", filters],
    queryFn: () => request<BikeListResponse>("/bikes", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useBike = (id: number | string) =>
  useQuery({
    queryKey: ["bikes", "detail", String(id)],
    queryFn: () => request<BikeResponse>(`/bikes/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useBikeFormOptions = () =>
  useQuery({
    queryKey: ["bikes", "form-options"],
    queryFn: () => request<ApiResponse<BikeFormOptions>>("/bikes/form-options").then((res) => res.data),
    staleTime: 60_000,
  });

export const useSaveBike = (id?: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) =>
      request<BikeResponse>(id ? `/bikes/${id}` : "/bikes", { method: "POST", body: payload }).then((res) => res.data),
    onSuccess: (data) => {
      if (data && id) queryClient.setQueryData(["bikes", "detail", String(id)], data);
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteBike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/bikes/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bikes"] }),
  });
};

export const useAssignBikeRider = (id: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riderId: number | null) =>
      request<BikeResponse>(`/bikes/${id}/assign-rider`, { method: "POST", body: { assigned_rider_id: riderId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
    },
  });
};
