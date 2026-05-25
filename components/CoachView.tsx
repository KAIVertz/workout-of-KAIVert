"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }
interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }

const ROLES = [
  { id: "coach",     label: "Coach",     prompt: "" },
  { id: "kine",      label: "Kiné",      prompt: "Mode KINÉ : spécialise-toi blessures, mobilité, récup." },
  { id: "nutrition", label: "Nutrition", prompt: "Mode NUTRITION VÉGANE : protéines, repas, timing, suppléments." },
  { id: "mental",    label: "Mental",    prompt: "Mode PRÉPA MENTALE : motivation, visualisation, routine." },
] as const;
type RoleId = typeof ROLES[number]["id"];

const SUGGESTIONS: Record<RoleId, string[]> = {
  coach:     ["Comment je progresse ?", "Quelle charge aujourd'hui ?", "Adapte pour mes blessures", "Volume ce mois-ci ?"],
  kine:      ["Mon hématome cuisse gauche", "Genou droit — exercices safe", "Étirements post-séance", "Temps de guérison ?"],
  nutrition: ["Protéines par jour ?", "Que manger avant séance ?", "Meilleures sources véganes", "Suppléments nécessaires ?"],
  mental:    ["Je suis démotivé", "Routine pré-séance", "Gérer les jours sans envie", "Visualisation"],
};

export function CoachView({ sessions }: { sessions: Session[] }) {
  const [role, setRole] = useState<RoleId>("coach");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const hist = [...messages, { role: "user" as const, content: msg }];
    setMessages(hist);
    setLoading(true);
    const rolePrompt = ROLES.find(r => r.id === role)?.prompt ?? "";
    try {
      const res = await fetch("/api/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages, context: { sessions: sessions.slice(0, 20), rolePrompt } }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let ai = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        ai += dec.decode(value, { stream: true });
        setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: ai }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur réseau — retente." }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#08080d" }}>
      {/* Role tabs */}
      <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => { setRole(r.id); setMessages([]); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: role === r.id ? 700 : 400,
                border: role === r.id ? "2px solid #0041C2" : "1px solid #1a1a2e",
                background: role === r.id ? "#0041C218" : "#10101a",
                color: role === r.id ? "#fff" : "#6b7280", cursor: "pointer", transition: "all 0.12s",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {SUGGESTIONS[role].map(s => (
              <button key={s} onClick={() => send(s)}
                style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "12px 16px", color: "#6b7280", fontSize: 14, textAlign: "left", cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "#0041C2" : "#10101a",
              border: m.role === "assistant" ? "1px solid #1a1a2e" : "none",
              color: "#fff", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
            }}>
              {m.content || (loading && i === messages.length - 1 ? <span style={{ opacity: 0.4 }}>…</span> : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 20px 16px", borderTop: "1px solid #1a1a2e", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 22, padding: "7px 7px 7px 14px" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Pose ta question…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, minWidth: 0 }} />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ background: "#0041C2", border: "none", borderRadius: 18, width: 36, height: 36, cursor: "pointer", opacity: loading || !input.trim() ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.15s" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
