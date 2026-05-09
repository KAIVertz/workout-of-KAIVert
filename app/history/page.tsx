"use client";
import { useEffect, useState } from "react";
import { DAY_LABEL } from "@/lib/program";
import { BottomNav } from "@/components/BottomNav";

interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }
interface Log { exercise_name: string; set_number: number; reps: number; weight_kg: number; }

function fmtDur(s: number) { const m = Math.floor(s/60); return m < 60 ? `${m}min` : `${Math.floor(m/60)}h${m%60}`; }

function SessionRow({ s }: { s: Session }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [open, setOpen] = useState(false);
  const info = DAY_LABEL[s.day_type as keyof typeof DAY_LABEL] ?? { label: s.day_type, color: "#666" };

  async function toggle() {
    if (!open && !logs.length) {
      const r = await fetch(`/api/sessions/${s.id}`);
      setLogs(await r.json());
    }
    setOpen((o) => !o);
  }

  const byEx: Record<string, Log[]> = {};
  for (const l of logs) { if (!byEx[l.exercise_name]) byEx[l.exercise_name] = []; byEx[l.exercise_name].push(l); }
  const workSets = logs.filter((l) => l.set_number > 0).length;

  return (
    <div className="border-b border-[#0d0d0d]">
      <button onClick={toggle} className="w-full flex items-center justify-between py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full mt-0.5 shrink-0" style={{ background: info.color }} />
          <div>
            <p className="text-white text-sm">
              {new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: info.color }}>{info.label}</span>
              {s.duration_seconds && <span className="text-[#444] text-xs">{fmtDur(s.duration_seconds)}</span>}
              {open && workSets > 0 && <span className="text-[#444] text-xs">{workSets} séries</span>}
            </div>
          </div>
        </div>
        <span className="text-[#333] text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="pb-4 pl-5 pr-4">
          {Object.keys(byEx).length === 0 ? <p className="text-[#444] text-sm">Aucune série.</p> :
            Object.entries(byEx).map(([name, sets]) => (
              <div key={name} className="mb-3">
                <p className="text-[#444] text-xs uppercase tracking-wider mb-1.5">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sets.sort((a, b) => a.set_number - b.set_number).map((l) => (
                    <span key={l.set_number} className="text-xs font-mono px-2 py-1 rounded-lg"
                      style={{ background: l.set_number === 0 ? "#1a1200" : "#0d0d0d", color: l.set_number === 0 ? "#ca8a04" : "#666", border: "1px solid #1a1a1a" }}>
                      {l.set_number === 0 ? "W " : ""}{l.reps > 0 ? `${l.reps}×${l.weight_kg}kg` : "—"}
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
    async function load() {
      try {
        const r = await fetch("/api/sessions");
        const data = await r.json();
        setSessions(Array.isArray(data) ? data.filter((s: Session) => s.completed) : []);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-[#333] text-sm">Chargement…</p></div>;

  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="px-5 pt-14 pb-6 border-b border-[#111]">
        <p className="text-[#444] text-sm mb-1">{sessions.length} séances</p>
        <h1 className="text-4xl font-bold tracking-tight">Historique</h1>
      </div>
      <div className="max-w-md mx-auto px-5 py-4">
        {sessions.length === 0
          ? <div className="py-20 text-center"><p className="text-white font-semibold mb-2">Aucune séance</p><p className="text-[#444] text-sm">Commence ta première séance.</p></div>
          : sessions.map((s) => <SessionRow key={s.id} s={s} />)}
      </div>
      <BottomNav />
    </div>
  );
}
