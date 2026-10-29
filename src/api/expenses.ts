import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, ExpenseFormOptions, ExpenseListResponse } from "../types";

export interface ExpenseFilters {
  page?: number;
  category?: string;
  start_date?: string;
  end_date?: string;
}

export const useExpenses = (filters: ExpenseFilters) =>
  useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => request<ExpenseListResponse>("/expenses", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useExpenseFormOptions = () =>
  useQuery({
    queryKey: ["expenses", "form-options"],
    queryFn: () => request<ApiResponse<ExpenseFormOptions>>("/expenses/form-options").then((res) => res.data),
    staleTime: 60_000,
  });

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      request<ApiResponse<{ id: number }>>("/expenses", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
};
