import { useQuery } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, DashboardData } from "../types";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: () => request<ApiResponse<DashboardData>>("/dashboard").then((res) => res.data),
  });
