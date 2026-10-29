"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { useTicket, useTicketActions, useDeleteTicket } from "@/src/api/help";
import { formatDate, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Panel from "@/src/components/organisms/client/Panel";

const STATUS_PILL: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const notify = useNotify();
  const { data: ticket, isLoading } = useTicket(id);
  const { reply, setStatus, assign } = useTicketActions(id);
  const deleteTicket = useDeleteTicket();
  const [message, setMessage] = useState("");

  if (isLoading) return <LoadingSpinner />;
  if (!ticket) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Ticket not found. <Link href="/dashboard/help" className="text-primary hover:underline">Back</Link>
      </div>
    );
  }

  const send = async () => {
    if (!message.trim()) return;
    try {
      await reply.mutateAsync(message.trim());
      setMessage("");
      notify.success("Reply sent");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      notify.success(msg);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this ticket?")) return;
    try {
      const res = await deleteTicket.mutateAsync(ticket.id);
      notify.success(res.message);
      router.replace("/dashboard/help");
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title={ticket.ticket_number} />
      <Link href="/dashboard/help" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ticket.subject}</h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_PILL[ticket.status]}`}>{statusLabel(ticket.status)}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{ticket.ticket_number} · {ticket.client?.name ?? "Unknown client"}</p>
        </div>
        <button onClick={handleDelete} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Conversation" padded={false}>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
              {ticket.messages.map((m) => (
                <div key={m.id} className={`px-6 py-4 ${m.sender_type === "admin" ? "bg-primary/5" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{m.sender_type === "admin" ? "Support" : ticket.client?.name ?? "Client"}</span>
                    <span className="text-xs text-gray-400">{formatDate(m.created_at, true)}</span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{m.message}</p>
                </div>
              ))}
              {ticket.messages.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">No messages yet.</p>}
            </div>
          </Panel>

          {ticket.status !== "closed" && (
            <div className="card p-4">
              <textarea
                rows={3}
                className="input"
                placeholder="Type your reply..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button onClick={send} disabled={reply.isPending || !message.trim()} className="btn-primary">
                  <Send className="w-4 h-4" /> {reply.isPending ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Status">
            <select className="input" value={ticket.status} onChange={(e) => run(() => setStatus.mutateAsync(e.target.value), "Status updated")}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </Panel>

          <Panel title="Assignment">
            <select className="input" value={ticket.assigned_to ?? ""} onChange={(e) => run(() => assign.mutateAsync(e.target.value ? Number(e.target.value) : null), "Ticket assigned")}>
              <option value="">Unassigned</option>
              {ticket.admins.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Panel>

          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-gray-500">Client</dt><dd className="text-gray-900 dark:text-gray-100">{ticket.client?.name ?? "—"}</dd></div>
              {ticket.client?.email && <div><dt className="text-xs text-gray-500">Email</dt><dd className="text-gray-900 dark:text-gray-100">{ticket.client.email}</dd></div>}
              {ticket.priority && <div><dt className="text-xs text-gray-500">Priority</dt><dd className="text-gray-900 dark:text-gray-100">{statusLabel(ticket.priority)}</dd></div>}
              <div><dt className="text-xs text-gray-500">Opened</dt><dd className="text-gray-900 dark:text-gray-100">{formatDate(ticket.created_at, true)}</dd></div>
              {ticket.resolved_at && <div><dt className="text-xs text-gray-500">Resolved</dt><dd className="text-gray-900 dark:text-gray-100">{formatDate(ticket.resolved_at, true)}</dd></div>}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
