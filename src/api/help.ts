import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, Faq, TicketDetail, TicketListResponse } from "../types";

// ─── FAQs ───
export const useFaqs = () =>
  useQuery({
    queryKey: ["help", "faqs"],
    queryFn: () => request<{ success: boolean; data: Faq[]; categories: string[] }>("/help/faqs"),
  });

export const useSaveFaq = (id?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      request<ApiResponse<Faq>>(id ? `/help/faqs/${id}` : "/help/faqs", { method: id ? "PUT" : "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help", "faqs"] }),
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/help/faqs/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help", "faqs"] }),
  });
};

// ─── Tickets ───
export interface TicketFilters { page?: number; status?: string; priority?: string; search?: string }

export const useTickets = (filters: TicketFilters) =>
  useQuery({
    queryKey: ["help", "tickets", filters],
    queryFn: () => request<TicketListResponse>("/help/tickets", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useTicket = (id: number | string) =>
  useQuery({
    queryKey: ["help", "tickets", "detail", String(id)],
    queryFn: () => request<ApiResponse<TicketDetail>>(`/help/tickets/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useTicketActions = (id: number | string) => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["help", "tickets", "detail", String(id)] });
    queryClient.invalidateQueries({ queryKey: ["help", "tickets"] });
  };
  return {
    reply: useMutation({
      mutationFn: (message: string) => request(`/help/tickets/${id}/reply`, { method: "POST", body: { message } }),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: (status: string) => request(`/help/tickets/${id}/status`, { method: "POST", body: { status } }),
      onSuccess: invalidate,
    }),
    assign: useMutation({
      mutationFn: (assigned_to: number | null) => request(`/help/tickets/${id}/assign`, { method: "POST", body: { assigned_to } }),
      onSuccess: invalidate,
    }),
  };
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/help/tickets/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help", "tickets"] }),
  });
};
