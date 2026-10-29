"use client";

import { useState } from "react";
import { Mail, MailCheck, MessageSquare, Send, Trash2, Users } from "lucide-react";
import {
  useContactMessages,
  useDeleteMessage,
  useDeleteSubscriber,
  useSubscribers,
  useWaitlist,
  useWaitlistActions,
} from "@/src/api/communications";
import { formatDate } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Pagination from "@/src/components/molecules/Pagination";

type Tab = "messages" | "subscribers" | "waitlist";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
      {children}
    </button>
  );
}

function MessagesTab() {
  const notify = useNotify();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useContactMessages(page);
  const deleteMessage = useDeleteMessage();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    try { const res = await deleteMessage.mutateAsync(id); notify.success(res.message); } catch (e) { notify.error(errorMessage(e)); }
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div className="card">
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {data?.data.map((m) => (
          <div key={m.id} className="px-6 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">{m.first_name} {m.last_name}</p>
                <span className="text-xs text-gray-400">{formatDate(m.created_at, true)}</span>
              </div>
              <p className="text-sm text-gray-500">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{m.message}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a href={`mailto:${m.email}`} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700" title="Reply by email"><Mail className="w-4 h-4" /></a>
              <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {data?.data.length === 0 && <p className="px-6 py-12 text-center text-gray-500">No contact messages yet.</p>}
      </div>
      {data && <Pagination meta={data.meta} onChange={setPage} />}
    </div>
  );
}

function SubscribersTab() {
  const notify = useNotify();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSubscribers(page);
  const deleteSubscriber = useDeleteSubscriber();

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this subscriber?")) return;
    try { const res = await deleteSubscriber.mutateAsync(id); notify.success(res.message); } catch (e) { notify.error(errorMessage(e)); }
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div className="card">
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {data?.data.map((s) => (
          <div key={s.id} className="px-6 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 dark:text-gray-100">{s.email}</p>
              <p className="text-xs text-gray-400">Subscribed {formatDate(s.created_at)}</p>
            </div>
            <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {data?.data.length === 0 && <p className="px-6 py-12 text-center text-gray-500">No newsletter subscribers yet.</p>}
      </div>
      {data && <Pagination meta={data.meta} onChange={setPage} />}
    </div>
  );
}

function WaitlistTab() {
  const notify = useNotify();
  const { data, isLoading } = useWaitlist();
  const { sendActivation, sendSample, sendLaunch } = useWaitlistActions();

  const run = async (fn: () => Promise<{ message: string }>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    try { const res = await fn(); notify.success(res.message); } catch (e) { notify.error(errorMessage(e)); }
  };

  const onSample = () => {
    const email = prompt("Send a sample launch email to which address?");
    if (email) run(() => sendSample.mutateAsync(email));
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end">
        <button onClick={onSample} disabled={sendSample.isPending} className="btn-secondary"><Send className="w-4 h-4" /> Send sample</button>
        <button onClick={() => run(() => sendLaunch.mutateAsync(), `Send launch emails to all ${data?.stats.total ?? 0} waitlist clients?`)} disabled={sendLaunch.isPending} className="btn-primary"><MailCheck className="w-4 h-4" /> Send launch to all</button>
      </div>
      <div className="card">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {data?.data.map((c) => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                  {c.activation_sent && <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Sent</span>}
                </div>
                <p className="text-sm text-gray-500">{c.email}{c.company_name ? ` · ${c.company_name}` : ""}</p>
              </div>
              <button onClick={() => run(() => sendActivation.mutateAsync(c.id))} disabled={sendActivation.isPending} className="btn-secondary shrink-0"><Send className="w-4 h-4" /> Activation</button>
            </div>
          ))}
          {data?.data.length === 0 && <p className="px-6 py-12 text-center text-gray-500">No clients on the waitlist.</p>}
        </div>
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  const [tab, setTab] = useState<Tab>("messages");

  return (
    <div className="space-y-6">
      <DocumentTitle title="Communications" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Communications</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Contact messages, newsletter subscribers and the launch waitlist.</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <TabButton active={tab === "messages"} onClick={() => setTab("messages")}><span className="inline-flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Messages</span></TabButton>
        <TabButton active={tab === "subscribers"} onClick={() => setTab("subscribers")}><span className="inline-flex items-center gap-1"><Users className="w-4 h-4" /> Subscribers</span></TabButton>
        <TabButton active={tab === "waitlist"} onClick={() => setTab("waitlist")}><span className="inline-flex items-center gap-1"><MailCheck className="w-4 h-4" /> Waitlist</span></TabButton>
      </div>

      {tab === "messages" && <MessagesTab />}
      {tab === "subscribers" && <SubscribersTab />}
      {tab === "waitlist" && <WaitlistTab />}
    </div>
  );
}
