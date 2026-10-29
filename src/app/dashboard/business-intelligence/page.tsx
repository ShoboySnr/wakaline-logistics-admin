"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Check, RefreshCw, Send, User, X } from "lucide-react";
import { useAskAnalyst, useBiBootstrap, useConfirmActions, useResetAnalyst } from "@/src/api/bi";
import { formatNaira } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import { BiBootstrap, BiPendingAction } from "@/src/types";

const STORE_KEY = "waka-bi-conversation";

const readStoredId = () => {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(STORE_KEY); } catch { return null; }
};
const storeId = (id: string) => {
  try { window.localStorage.setItem(STORE_KEY, id); } catch {}
};

interface ChatMessage { role: "user" | "assistant"; html: string | null; text: string }

function KpiRow({ kpis }: { kpis: BiBootstrap["kpis"] }) {
  const items = [
    { label: `Revenue · ${kpis.month_label}`, value: formatNaira(kpis.revenue) },
    { label: "Expenses", value: formatNaira(kpis.expenses) },
    { label: "Profit", value: formatNaira(kpis.profit) },
    { label: "Orders this month", value: kpis.orders_this_month },
    { label: "Delivered", value: kpis.delivered_this_month },
    { label: "Pending", value: kpis.pending_orders },
    { label: "Unassigned", value: kpis.unassigned_orders },
    { label: "Active riders", value: kpis.active_riders },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((i) => (
        <div key={i.label} className="card p-3">
          <p className="text-xs text-gray-500">{i.label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function Chat({ bootstrap, onReset }: { bootstrap: BiBootstrap; onReset: (newId: string) => void }) {
  const notify = useNotify();
  const ask = useAskAnalyst();
  const confirm = useConfirmActions();
  const reset = useResetAnalyst();

  const [conversationId, setConversationId] = useState(bootstrap.conversation_id);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    bootstrap.transcript.map((t) => ({ role: t.role === "assistant" ? "assistant" : "user", html: t.html, text: t.text })),
  );
  const [pending, setPending] = useState<BiPendingAction[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = ask.isPending || confirm.isPending;

  const scrollToEnd = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));

  const pushResult = (data: Awaited<ReturnType<typeof ask.mutateAsync>>) => {
    if (data.status === "answer") {
      setMessages((m) => [...m, { role: "assistant", html: data.answer_html ?? null, text: data.answer ?? "" }]);
      setPending([]);
    } else if (data.status === "needs_confirmation") {
      if (data.preamble) setMessages((m) => [...m, { role: "assistant", html: data.preamble_html ?? null, text: data.preamble ?? "" }]);
      setPending(data.pending ?? []);
    } else {
      notify.error(data.message ?? "Something went wrong");
    }
    scrollToEnd();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", html: null, text }]);
    scrollToEnd();
    try {
      pushResult(await ask.mutateAsync({ conversation_id: conversationId, message: text }));
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const decide = async (decision: "approve" | "deny", all = false, single?: string) => {
    const decisions: Record<string, "approve" | "deny"> = {};
    pending.forEach((p) => { decisions[p.id] = all ? decision : single === p.id ? decision : "deny"; });
    try {
      pushResult(await confirm.mutateAsync({ conversation_id: conversationId, decisions }));
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const startNew = async () => {
    if (!window.confirm("Start a new conversation? The current one will be cleared.")) return;
    try {
      const res = await reset.mutateAsync(conversationId);
      const newId = res.data.conversation_id;
      storeId(newId);
      setConversationId(newId);
      setMessages([]);
      setPending([]);
      onReset(newId);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <div className="card flex flex-col h-[calc(100vh-20rem)] min-h-[420px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /> Metter Analyst</span>
        <button onClick={startNew} disabled={reset.isPending} className="text-sm text-gray-500 hover:text-primary inline-flex items-center gap-1"><RefreshCw className="w-4 h-4" /> New conversation</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <Bot className="w-10 h-10 mb-2" />
            <p className="text-sm">Ask anything about orders, riders, clients, revenue or expenses.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></div>}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700/60"}`}>
              {m.role === "assistant" && m.html
                ? <div className="ai-answer" dangerouslySetInnerHTML={{ __html: m.html }} />
                : <p className={`text-sm whitespace-pre-line ${m.role === "user" ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>{m.text}</p>}
            </div>
            {m.role === "user" && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-gray-600 dark:text-gray-300" /></div>}
          </div>
        ))}

        {busy && <div className="flex items-center gap-2 text-sm text-gray-400"><Bot className="w-4 h-4" /> Thinking…</div>}

        {pending.length > 0 && (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" /> Approval needed</p>
            <div className="space-y-2 mb-3">
              {pending.map((p) => (
                <div key={p.id} className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.summary}</p>
                  {p.reason && <p className="text-xs text-gray-500 mt-0.5">{p.reason}</p>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => decide("approve", false, p.id)} disabled={busy} className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                    <button onClick={() => decide("deny", false, p.id)} disabled={busy} className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 inline-flex items-center gap-1"><X className="w-3 h-3" /> Deny</button>
                  </div>
                </div>
              ))}
            </div>
            {pending.length > 1 && (
              <div className="flex gap-2">
                <button onClick={() => decide("approve", true)} disabled={busy} className="btn-primary flex-1">Approve all</button>
                <button onClick={() => decide("deny", true)} disabled={busy} className="btn-secondary flex-1">Deny all</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            className="input resize-none"
            placeholder="Ask the analyst..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={busy || pending.length > 0}
          />
          <button onClick={send} disabled={busy || pending.length > 0 || !input.trim()} className="btn-primary shrink-0"><Send className="w-4 h-4" /></button>
        </div>
        {pending.length > 0 && <p className="text-xs text-gray-400 mt-1">Resolve the pending actions above before asking again.</p>}
      </div>
    </div>
  );
}

export default function BusinessIntelligencePage() {
  const [conversationId, setConversationId] = useState<string | null>(() => readStoredId());
  const { data, isLoading } = useBiBootstrap(conversationId);

  useEffect(() => {
    if (data?.conversation_id) storeId(data.conversation_id);
  }, [data?.conversation_id]);

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DocumentTitle title="Business Intelligence" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Intelligence</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Ask the analyst anything about the business. It can read everything and propose changes for your approval.</p>
      </div>

      <KpiRow kpis={data.kpis} />

      {!data.configured ? (
        <div className="card p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-gray-700 dark:text-gray-200 font-medium">The AI analyst is not configured</p>
          <p className="text-sm text-gray-500 mt-1">Set the Anthropic API key on the server to enable conversations.</p>
        </div>
      ) : (
        <Chat key={data.conversation_id} bootstrap={data} onReset={setConversationId} />
      )}
    </div>
  );
}
