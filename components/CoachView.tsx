"use client";
import { useState, useRef, useEffect } from "react";
import { Session } from "@/lib/types";

interface Message { role: "user" | "assistant"; content: string; }

const BG = "#09090b";
const SURFACE = "#111113";
const BORDER = "#27272a";
const MUTED = "#52525b";
const ARIA = "#0EA5E9";

export function CoachView({ sessions, ariaBrief, stagnantExercises = [] }: { sessions: Session[]; ariaBrief?: string; stagnantExercises?: string[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const chips = [
    stagnantExercises.length > 0
      ? { icon: "dumbbell", text: `Comment améliorer mon ${stagnantExercises[0]} ?` }
      : { icon: "dumbbell", text: "Comment progresser cette semaine ?" },
    { icon: "moon", text: "Plan de récupération pour ce soir" },
    { icon: "trend", text: "Analyse ma semaine" },
  ];

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const hist = [...messages, { role: "user" as const, content: msg }];
    setMessages(hist);
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages, context: { sessions: sessions.slice(0, 20) } }),
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

  function ChipIcon({ type }: { type: string }) {
    if (type === "dumbbell") return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11M6.5 17.5h11" /><rect x="3" y="8.5" width="3.5" height="7" rx="1" /><rect x="17.5" y="8.5" width="3.5" height="7" rx="1" />
      </svg>
    );
    if (type === "moon") return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    );
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: BG, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${ARIA}09 0%, transparent 60%)` }} />

      {/* Header */}
      <div style={{ padding: "max(20px, calc(env(safe-area-inset-top) + 12px)) 20px 0", flexShrink: 0, position: "relative" }}>
        <p className="font-racing" style={{ fontSize: 38, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>ARIA</p>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Coach IA · Brief du jour</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
        {messages.length === 0 && (
          <>
            {ariaBrief && (
              <div style={{ background: "#040d14", border: "1px solid #0EA5E922", borderLeft: "3px solid #0EA5E9", borderRadius: 18, padding: "16px 18px", marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: ARIA, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: ARIA, boxShadow: `0 0 6px ${ARIA}`, display: "inline-block" }} />
                  Brief du jour
                </p>
                <p style={{ fontSize: 14, color: "#e4e4e7", lineHeight: 1.7 }}>{ariaBrief}</p>
              </div>
            )}

            {stagnantExercises.length > 0 && (
              <div style={{ background: SURFACE, border: "1px solid #F59E0B33", borderLeft: "3px solid #F59E0B", borderRadius: 18, padding: "14px 16px", marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  À améliorer
                </p>
                <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>
                  {stagnantExercises[0]} — stagnation détectée. Objectif : +0.5 kg cette semaine.
                </p>
              </div>
            )}

            <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 700, marginTop: 4, marginBottom: 8 }}>Demande à ARIA</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {chips.map(chip => (
                <button key={chip.text} onClick={() => send(chip.text)}
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 13, padding: "13px 14px", fontSize: 13, color: "#a1a1aa", textAlign: "left" as const, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 24, flexShrink: 0, display: "flex" }}><ChipIcon type={chip.icon} /></span>
                  {chip.text}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", padding: "11px 15px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "#F97316" : SURFACE, border: m.role === "assistant" ? `1px solid ${BORDER}` : "none", boxShadow: m.role === "user" ? "0 0 18px #F9731644" : "none", color: "#fff", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {m.content || (loading && i === messages.length - 1 ? <span style={{ opacity: 0.4, letterSpacing: 3 }}>···</span> : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 20px max(18px, calc(env(safe-area-inset-bottom) + 10px))", borderTop: `1px solid ${BORDER}`, flexShrink: 0, position: "relative" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "12px 16px" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Pose ta question à ARIA…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, minWidth: 0 }} />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ width: 36, height: 36, borderRadius: 10, background: ARIA, border: "none", cursor: "pointer", opacity: loading || !input.trim() ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: !loading && input.trim() ? `0 0 14px ${ARIA}66` : "none" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M2 8l12-6-6 12V9L2 8z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
