"use client";
import { useEffect, useState } from "react";
import { Session } from "@/lib/types";

const ACCENT = "#0041C2";
const CHECKLIST = [
  { id: "stretch",   label: "Étirements ciblés", sub: "5-10 min, zones travaillées récemment" },
  { id: "zone2",     label: "Marche Zone 2",      sub: "10 min après un repas — simple & efficace" },
  { id: "balance",   label: "Équilibre 30s/jambe", sub: "Yeux fermés, indicateur neurologique" },
  { id: "hydration", label: "Hydratation",         sub: "2L minimum aujourd'hui" },
  { id: "protein",   label: "Protéines véganes",   sub: "35-40g ce soir (tofu, edamame, lentilles)" },
];

export function RecoveryModal({ sessions, onClose }: { sessions: Session[]; onClose: () => void }) {
  const [aiMsg, setAiMsg] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const recentTypes = sessions.filter(s => s.completed).slice(0, 5).map(s => s.day_type).join(", ");
    const msg = `Génère un plan de récupération active pour aujourd'hui. Séances récentes : ${recentTypes || "aucune"}. Inclus : 3-4 étirements ciblés par zone musculaire (avec durée), un conseil mobilité, et un rappel nutrition végane. Sois concis et pratique.`;
    fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history: [], context: { sessions: sessions.slice(0, 10) } }),
    }).then(async res => {
      if (!res.ok) return;
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setAiMsg(text);
      }
    }).catch(() => setAiMsg("Repos complet : étirements 5min, marche 10min, 2L d'eau."));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      navigator.vibrate?.(checked.has(id) ? [20] : [40]);
      return next;
    });
  }

  const doneCount = checked.size;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, background: "#08080d",
      display: "flex", flexDirection: "column",
      paddingTop: "max(56px, calc(env(safe-area-inset-top) + 24px))",
      paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 16px))",
      overflowY: "auto",
    }}>
      {/* Radial glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 80% 45% at 50% 0%, ${ACCENT}14 0%, transparent 60%)` }} />

      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", padding: "0 24px", display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.14em" }}>Journée de</p>
            <p className="font-racing" style={{ fontSize: 44, fontWeight: 900, fontStyle: "italic", color: "#fff", lineHeight: 0.95, letterSpacing: "-0.02em" }}>RÉCUP</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#374151", fontSize: 26, cursor: "pointer", lineHeight: 1, paddingTop: 4 }}>×</button>
        </div>

        {/* ARIA plan */}
        <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 22, padding: "18px 20px", marginBottom: 20 }}>
          <p className="font-racing" style={{ fontSize: 12, fontWeight: 700, fontStyle: "italic", color: ACCENT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Plan ARIA
          </p>
          {aiMsg ? (
            <p style={{ fontSize: 14, color: "#e5e7eb", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiMsg}</p>
          ) : (
            <p style={{ fontSize: 13, color: "#374151" }}>Génération du plan…</p>
          )}
        </div>

        {/* Checklist */}
        <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          Check-list récup · {doneCount}/{CHECKLIST.length}
        </p>
        <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 22, overflow: "hidden", marginBottom: 24 }}>
          {CHECKLIST.map((item, i) => {
            const done = checked.has(item.id);
            return (
              <button key={item.id} onClick={() => toggle(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                  borderBottom: i < CHECKLIST.length - 1 ? "1px solid #0d0d1a" : "none",
                  background: "none", border: "none", cursor: "pointer",
                  borderLeft: done ? `3px solid ${ACCENT}` : "3px solid transparent",
                  transition: "border-color 0.2s",
                  textAlign: "left",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: done ? ACCENT : "#0a0a14",
                  border: done ? "none" : "1.5px solid #1a1a2e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: done ? `0 0 12px ${ACCENT}55` : "none",
                  transition: "all 0.2s",
                }}>
                  {done && <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: done ? "#6b7280" : "#fff", textDecoration: done ? "line-through" : "none", transition: "color 0.2s" }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{item.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        {doneCount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 4, background: "#1a1a2e", borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${(doneCount / CHECKLIST.length) * 100}%`, background: ACCENT, borderRadius: 3, boxShadow: `0 0 10px ${ACCENT}66`, transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
            {doneCount === CHECKLIST.length && (
              <p className="font-racing" style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", color: "#059669", marginTop: 8, textAlign: "center" }}>
                Récup complète. Ton corps te remerciera.
              </p>
            )}
          </div>
        )}

        <button onClick={onClose}
          style={{ marginTop: "auto", padding: "19px 0", borderRadius: 18, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-barlow), system-ui", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: `0 0 24px ${ACCENT}44` }}>
          Fermer
        </button>
      </div>
    </div>
  );
}
