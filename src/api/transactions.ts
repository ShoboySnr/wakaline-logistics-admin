import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, TransactionDetail, TransactionListResponse } from "../types";

export interface TransactionFilters {
  page?: number;
  status?: string;
  type?: string;
  search?: string;
}

export const useTransactions = (filters: TransactionFilters) =>
  useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => request<TransactionListResponse>("/transactions", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useTransaction = (id: number | string | null) =>
  useQuery({
    queryKey: ["transactions", "detail", String(id)],
    queryFn: () => request<ApiResponse<TransactionDetail>>(`/transactions/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useTransactionAction = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return {
    approve: useMutation({
      mutationFn: (id: number) => request<ApiResponse<TransactionDetail>>(`/transactions/${id}/approve`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: ({ id, reason }: { id: number; reason: string }) =>
        request<ApiResponse<TransactionDetail>>(`/transactions/${id}/reject`, { method: "POST", body: { reason } }),
      onSuccess: invalidate,
    }),
    reverse: useMutation({
      mutationFn: ({ id, reason }: { id: number; reason: string }) =>
        request<ApiResponse<TransactionDetail>>(`/transactions/${id}/reverse`, { method: "POST", body: { reason } }),
      onSuccess: invalidate,
    }),
  };
};
