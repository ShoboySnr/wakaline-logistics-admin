import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, JobApplicationDetail, JobApplicationListResponse } from "../types";

export interface JobApplicationFilters { page?: number; search?: string; status?: string; job_type?: string }

export const useJobApplications = (filters: JobApplicationFilters) =>
  useQuery({
    queryKey: ["job-applications", filters],
    queryFn: () => request<JobApplicationListResponse>("/job-applications", { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useJobApplication = (id: number | string) =>
  useQuery({
    queryKey: ["job-applications", "detail", String(id)],
    queryFn: () => request<ApiResponse<JobApplicationDetail>>(`/job-applications/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useUpdateApplicationStatus = (id: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: string; admin_notes?: string }) =>
      request<ApiResponse<JobApplicationDetail>>(`/job-applications/${id}/status`, { method: "POST", body }).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["job-applications", "detail", String(id)], data);
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/job-applications/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-applications"] }),
  });
};
