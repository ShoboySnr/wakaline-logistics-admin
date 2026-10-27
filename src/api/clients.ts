import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, ClientDetail, ClientFormOptions, ClientListResponse, ClientStock, Order, PaginationMeta } from "../types";

export interface ClientFilters {
  page?: number;
  search?: string;
  status?: string;
  remittance?: string;
}

type ClientResponse = ApiResponse<ClientDetail> & { message?: string };

export const useClients = (filters: ClientFilters) =>
  useQuery({
    queryKey: ["clients", filters],
    queryFn: () => request<ClientListResponse>("/clients", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useClient = (id: number | string) =>
  useQuery({
    queryKey: ["clients", "detail", String(id)],
    queryFn: () => request<ClientResponse>(`/clients/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useClientOrders = (id: number | string, page: number) =>
  useQuery({
    queryKey: ["clients", "detail", String(id), "orders", page],
    queryFn: () => request<{ success: boolean; data: Order[]; meta: PaginationMeta }>(`/clients/${id}/orders`, { query: { page } }),
    placeholderData: keepPreviousData,
  });

export const useClientFormOptions = () =>
  useQuery({
    queryKey: ["clients", "form-options"],
    queryFn: () => request<ApiResponse<ClientFormOptions>>("/clients/form-options").then((res) => res.data),
    staleTime: 60_000,
  });

const useClientMutation = <TPayload>(id: number | string | undefined, call: (payload: TPayload) => Promise<ClientResponse>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSuccess: (res) => {
      if (res?.data && id) queryClient.setQueryData(["clients", "detail", String(id)], res.data);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "form-options"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useSaveClient = (id?: number | string) =>
  useClientMutation<Record<string, unknown>>(id, (payload) =>
    request<ClientResponse>(id ? `/clients/${id}` : "/clients", { method: id ? "PUT" : "POST", body: payload }),
  );

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
};

export const useClientAction = (id: number | string) => ({
  subscribe: useClientMutation<{ subscription_plan_id: number; starts_at: string; notes?: string }>(id, (body) =>
    request(`/clients/${id}/subscribe`, { method: "POST", body }),
  ),
  credits: useClientMutation<{ type: "add" | "deduct"; credits: number; reason: string }>(id, (body) =>
    request(`/clients/${id}/credits`, { method: "POST", body }),
  ),
  verifyEmail: useClientMutation<void>(id, () => request(`/clients/${id}/verify-email`, { method: "POST" })),
  stocks: useClientMutation<{ stocks: Partial<ClientStock>[] }>(id, (body) => request(`/clients/${id}/stocks`, { method: "PUT", body })),
  toggleRemittance: useClientMutation<void>(id, () => request(`/clients/${id}/toggle-remittance`, { method: "POST" })),
  shareLink: useClientMutation<"generate" | "disable">(id, (action) => request(`/clients/${id}/share-link`, { method: "POST", body: { action } })),
  apiAccess: useClientMutation<"generate" | "regenerate" | "enable" | "disable">(id, (action) =>
    request(`/clients/${id}/api-access`, { method: "POST", body: { action } }),
  ),
});

export const useCreateInvoice = (clientId: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      request<ApiResponse<{ id: number; invoice_number: string }>>(`/clients/${clientId}/invoices`, { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", "detail", String(clientId)] }),
  });
};

export const useDeleteInvoice = (clientId: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => request<{ success: boolean; message: string }>(`/invoices/${invoiceId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", "detail", String(clientId)] }),
  });
};
