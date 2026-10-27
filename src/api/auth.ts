import { request } from "../helpers/request";
import { AdminUser, ApiResponse } from "../types";

export const login = (email: string, password: string) =>
  request<ApiResponse<{ user: AdminUser; token: string }>>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const fetchMe = () => request<ApiResponse<AdminUser>>("/auth/me");

export const logoutRequest = () => request<{ success: boolean }>("/auth/logout", { method: "POST" });
