import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, Order, OrderFormOptions, OrderListResponse, OrderStatus, RemittanceData } from "../types";

export interface OrderFilters {
  page?: number;
  status?: string;
  search?: string;
  client_id?: string;
  date_filter?: string;
  start_date?: string;
  end_date?: string;
  no_delivery_date?: string;
}

export const useOrders = (filters: OrderFilters) =>
  useQuery({
    queryKey: ["orders", filters],
    queryFn: () => request<OrderListResponse>("/orders", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useOrder = (id: number | string) =>
  useQuery({
    queryKey: ["orders", "detail", String(id)],
    queryFn: () => request<ApiResponse<Order>>(`/orders/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useOrderFormOptions = () =>
  useQuery({
    queryKey: ["orders", "form-options"],
    queryFn: () => request<ApiResponse<OrderFormOptions>>("/orders/form-options").then((res) => res.data),
    staleTime: 60_000,
  });

export const useRemittance = (clientId: string) =>
  useQuery({
    queryKey: ["orders", "remittance", clientId],
    queryFn: () => request<ApiResponse<RemittanceData>>("/orders/remittance", { query: { client_id: clientId } }).then((res) => res.data),
    enabled: !!clientId,
  });

const useInvalidateOrders = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

export const useSaveOrder = (id?: number | string) => {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (payload: FormData) =>
      request<ApiResponse<Order>>(id ? `/orders/${id}` : "/orders", { method: "POST", body: payload }).then((res) => res.data),
    onSuccess: invalidate,
  });
};

export const useUpdateOrderStatus = (id: number | string) => {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (status: OrderStatus) =>
      request<ApiResponse<Order>>(`/orders/${id}/status`, { method: "PATCH", body: { status } }).then((res) => res.data),
    onSuccess: invalidate,
  });
};

export const useAssignRider = (id: number | string) => {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (riderId: number | null) =>
      request<ApiResponse<Order>>(`/orders/${id}/rider`, { method: "PATCH", body: { rider_id: riderId } }).then((res) => res.data),
    onSuccess: invalidate,
  });
};

export const useDeleteOrder = () => {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean }>(`/orders/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
};

export const useMarkRemitted = () => {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (payload: { client_id: number; order_ids: number[] }) =>
      request<{ success: boolean; message: string }>("/orders/remittance/mark-remitted", { method: "POST", body: payload }),
    onSuccess: invalidate,
  });
};
