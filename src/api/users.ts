import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { AdminUserRow, ApiResponse, UserListResponse } from "../types";

export interface UserFilters { page?: number; search?: string; role?: string }

export const useUsers = (filters: UserFilters) =>
  useQuery({
    queryKey: ["users", filters],
    queryFn: () => request<UserListResponse>("/users", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

const useUserMutation = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["users"] });
};

export const useSaveUser = (id?: number) => {
  const invalidate = useUserMutation();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      request<ApiResponse<AdminUserRow>>(id ? `/users/${id}` : "/users", { method: id ? "PUT" : "POST", body }),
    onSuccess: invalidate,
  });
};

export const useUpdateUserPassword = (id: number) =>
  useMutation({
    mutationFn: (body: { password: string; password_confirmation: string }) =>
      request<{ success: boolean; message: string }>(`/users/${id}/password`, { method: "PUT", body }),
  });

export const useToggleAdmin = () => {
  const invalidate = useUserMutation();
  return useMutation({
    mutationFn: (id: number) => request<ApiResponse<AdminUserRow>>(`/users/${id}/toggle-admin`, { method: "POST" }),
    onSuccess: invalidate,
  });
};

export const useDeleteUser = () => {
  const invalidate = useUserMutation();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
};
