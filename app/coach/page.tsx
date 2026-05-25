"use client";
import { useState, useRef, useEffect } from "react";
import { TopNav } from "@/components/BottomNav";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Session {
  id: number;
  date: string;
  day_type: string;
  completed: boolean;
  duration_seconds: number;
}

const SUGGESTIONS = [
  "Comment je progresse cette semaine ?",
  "Adapte le programme pour mes blessures",
  "Quel volume j'ai fait ce mois-ci ?",
  "Conseille-moi sur ma nutrition végane",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data: Session[]) => setSessions(data.slice(0, 20)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || loading) return;
    setInput("");

    const newHistory = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
          context: { sessions },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: aiText },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erreur réseau — retente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#08080d",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <TopNav />
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: 0 }}>
            KAI Coach
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            IA entraînement · Analyse · Adaptation
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: "12px 20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <>
            <p style={{ color: "#374151", fontSize: 13, textAlign: "center", marginBottom: 8 }}>
              Accès à {sessions.length} séances · Connaissance du programme
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: "#10101a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: "12px 16px",
                    color: "#9ca3af",
                    fontSize: 14,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "11px 15px",
                borderRadius:
                  m.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                background: m.role === "user" ? "#0041C2" : "#10101a",
                border: m.role === "assistant" ? "1px solid #1a1a2e" : "none",
                color: "#fff",
                fontSize: 15,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content ||
                (loading && i === messages.length - 1 ? (
                  <span style={{ opacity: 0.5 }}>...</span>
                ) : (
                  ""
                ))}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 20px 32px",
          borderTop: "1px solid #1a1a2e",
          background: "#08080d",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "#10101a",
            border: "1px solid #1a1a2e",
            borderRadius: 24,
            padding: "8px 8px 8px 16px",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Pose ta question..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 15,
              minWidth: 0,
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              background: "#0041C2",
              border: "none",
              borderRadius: 20,
              width: 40,
              height: 40,
              cursor: loading || !input.trim() ? "default" : "pointer",
              opacity: loading || !input.trim() ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "opacity 0.15s",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
