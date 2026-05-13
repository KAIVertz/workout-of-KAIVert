"use client";
import { useEffect, useState } from "react";
import { DAY_LABEL } from "@/lib/program";
import { TopNav } from "@/components/BottomNav";

interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }
interface Log { exercise_name: string; set_number: number; reps: number; weight_kg: number; }

function fmtDur(s: number) { const m = Math.floor(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}` : ""}`; }

function SessionRow({ s }: { s: Session }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [open, setOpen] = useState(false);
  const info = DAY_LABEL[s.day_type as keyof typeof DAY_LABEL] ?? { label: s.day_type, color: "#6b7280" };

  async function toggle() {
    if (!open && !logs.length) {
      const r = await fetch(`/api/sessions/${s.id}`);
      const d = await r.json();
      if (Array.isArray(d)) setLogs(d);
    }
    setOpen((o) => !o);
  }

  const byEx: Record<string, Log[]> = {};
  for (const l of logs) { if (!byEx[l.exercise_name]) byEx[l.exercise_name] = []; byEx[l.exercise_name].push(l); }
  const workSets = logs.filter((l) => l.set_number > 0).length;

  return (
    <div style={{ borderBottom: "1px solid #1a1a2e" }}>
      <button onClick={toggle} style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 0", background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: info.color, marginTop: 6, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>
              {new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
              <span style={{ fontSize: 12, color: info.color }}>{info.label}</span>
              {s.duration_seconds && <span style={{ fontSize: 12, color: "#374151" }}>{fmtDur(s.duration_seconds)}</span>}
              {open && workSets > 0 && <span style={{ fontSize: 12, color: "#374151" }}>{workSets} séries</span>}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#374151", paddingTop: 4 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ paddingBottom: 16, paddingLeft: 18 }}>
          {Object.keys(byEx).length === 0
            ? <p style={{ fontSize: 13, color: "#374151" }}>Aucune série enregistrée.</p>
            : Object.entries(byEx).map(([name, sets]) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{name}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {sets.sort((a, b) => a.set_number - b.set_number).map((l) => (
                    <span key={l.set_number} style={{
                      fontSize: 12, fontFamily: "monospace",
                      padding: "4px 10px", borderRadius: 8,
                      background: "#10101a", border: "1px solid #1a1a2e",
                      color: l.reps > 0 ? "#9ca3af" : "#374151",
                    }}>
                      {l.reps > 0 ? `${l.reps}×${l.weight_kg}kg` : "—"}
                    </span>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d.filter((s: Session) => s.completed) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#374151", fontSize: 14 }}>Chargement…</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100svh", background: "#08080d" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 20px 48px" }}>
        <TopNav />
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{sessions.length} séances</p>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", color: "#fff" }}>Historique</h1>
        </div>

        {sessions.length === 0 ? (
          <div style={{ paddingTop: 60, textAlign: "center" }}>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Aucune séance</p>
            <p style={{ color: "#374151", fontSize: 14 }}>Commence ta première séance.</p>
          </div>
        ) : (
          sessions.map((s) => <SessionRow key={s.id} s={s} />)
        )}
      </div>
    </div>
  );
}
