import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ApiResponse, BiBootstrap, BiResult } from "../types";

export const useBiBootstrap = (conversationId: string | null) =>
  useQuery({
    queryKey: ["bi", "bootstrap", conversationId],
    queryFn: () => request<ApiResponse<BiBootstrap>>("/business-intelligence", { query: { conversation_id: conversationId ?? undefined } }).then((r) => r.data),
  });

export const useAskAnalyst = () =>
  useMutation({
    mutationFn: (body: { conversation_id: string; message: string }) => request<BiResult>("/business-intelligence/ask", { method: "POST", body }),
  });

export const useConfirmActions = () =>
  useMutation({
    mutationFn: (body: { conversation_id: string; decisions: Record<string, "approve" | "deny"> }) =>
      request<BiResult>("/business-intelligence/confirm", { method: "POST", body }),
  });

export const useResetAnalyst = () =>
  useMutation({
    mutationFn: (conversationId: string | null) => request<ApiResponse<{ conversation_id: string }>>("/business-intelligence/reset", { method: "POST", body: { conversation_id: conversationId } }),
  });
