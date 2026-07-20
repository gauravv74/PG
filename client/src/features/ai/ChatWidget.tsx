import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";

interface Msg {
  role: "user" | "bot";
  text: string;
  filters?: Record<string, unknown>;
}

export default function ChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Hi! Tell me what you're looking for, e.g. ‘studio under ₹15,000 near Pune University’." },
  ]);

  async function send() {
    if (!input.trim() || busy) return;
    const text = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const { data } = await api.post("/ai/chat", { message: text });
      setMessages((m) => [...m, { role: "bot", text: data.reply, filters: data.suggested_filters }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I had trouble. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function applyFilters(filters: Record<string, unknown>) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v == null) return;
      if (Array.isArray(v)) v.forEach((x) => params.append(k, String(x)));
      else params.append(k, String(v));
    });
    navigate(`/search?${params.toString()}`);
    setOpen(false);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <span className="flex items-center gap-2 font-semibold">
              <Sparkles size={16} /> UniNest AI
            </span>
            <button onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
                {m.filters && Object.keys(m.filters).length > 0 && (
                  <button
                    onClick={() => applyFilters(m.filters!)}
                    className="mt-1 block text-xs font-semibold text-brand-600"
                  >
                    → View matching homes
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything…"
              className="input"
            />
            <button onClick={send} className="btn-primary !px-3" disabled={busy}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-card transition hover:scale-105"
        aria-label="Open AI assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
