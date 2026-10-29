import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../helpers/request";
import { ContactMessageListResponse, SubscriberListResponse, WaitlistResponse } from "../types";

export const useSubscribers = (page: number) =>
  useQuery({ queryKey: ["comms", "subscriptions", page], queryFn: () => request<SubscriberListResponse>("/communications/subscriptions", { query: { page } }), placeholderData: keepPreviousData });

export const useContactMessages = (page: number) =>
  useQuery({ queryKey: ["comms", "messages", page], queryFn: () => request<ContactMessageListResponse>("/communications/messages", { query: { page } }), placeholderData: keepPreviousData });

export const useWaitlist = () =>
  useQuery({ queryKey: ["comms", "waitlist"], queryFn: () => request<WaitlistResponse>("/communications/waitlist") });

export const useDeleteSubscriber = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/communications/subscriptions/${id}`, { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comms", "subscriptions"] }) });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/communications/messages/${id}`, { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comms", "messages"] }) });
};

export const useWaitlistActions = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["comms", "waitlist"] });
  return {
    sendActivation: useMutation({ mutationFn: (id: number) => request<{ success: boolean; message: string }>(`/communications/waitlist/${id}/send-activation`, { method: "POST" }), onSuccess: invalidate }),
    sendSample: useMutation({ mutationFn: (email: string) => request<{ success: boolean; message: string }>("/communications/waitlist/send-sample", { method: "POST", body: { email } }) }),
    sendLaunch: useMutation({ mutationFn: () => request<{ success: boolean; message: string; data: { sent: number; failed: number } }>("/communications/waitlist/send-launch", { method: "POST" }), onSuccess: invalidate }),
  };
};
