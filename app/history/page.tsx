"use client";

import { useEffect, useState } from "react";
import { ACCENT, DayType, WEEKLY_SCHEDULE } from "@/lib/program";
import { BottomNav } from "@/components/BottomNav";

interface Session {
  id: number;
  date: string;
  day_type: DayType;
  completed: boolean;
  duration_seconds?: number;
}

interface LogEntry {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
}

const ALL_DAYS = Object.values(WEEKLY_SCHEDULE).filter(Boolean) as DayType[];

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

function SessionCard({ session }: { session: Session }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const a = ACCENT[session.day_type];

  async function fetchLogs() {
    if (logs.length) return;
    const res = await fetch(`/api/sessions/${session.id}`);
    setLogs(await res.json());
  }

  function toggle() {
    if (!open) fetchLogs();
    setOpen((o) => !o);
  }

  const byExercise: Record<string, LogEntry[]> = {};
  for (const l of logs) {
    if (!byExercise[l.exercise_name]) byExercise[l.exercise_name] = [];
    byExercise[l.exercise_name].push(l);
  }

  const workSets = logs.filter((l) => l.set_number > 0 && l.reps > 0).length;
  const volume = logs.filter((l) => l.set_number > 0 && l.reps > 0)
    .reduce((acc, l) => acc + Number(l.reps) * Number(l.weight_kg), 0);

  return (
    <div className="border border-[#1e1e1e] rounded-2xl overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-[#111] transition-colors">
        <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: a.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">
            {new Date(session.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs" style={{ color: a.color }}>{a.label}</span>
            {open && workSets > 0 && <span className="text-[#444] text-xs">{workSets} sets · {volume.toLocaleString()}kg</span>}
            {session.duration_seconds && <span className="text-[#444] text-xs">{fmtDuration(session.duration_seconds)}</span>}
          </div>
        </div>
        <span className="text-[#333] text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#161616]">
          {!Object.keys(byExercise).length ? (
            <p className="text-[#444] text-sm pt-3">No sets logged.</p>
          ) : (
            Object.entries(byExercise).map(([name, sets]) => (
              <div key={name} className="mt-4">
                <p className="text-[#444] text-xs uppercase tracking-wider font-medium mb-2">{name}</p>
                <div className="flex flex-wrap gap-2">
                  {sets.sort((a, b) => a.set_number - b.set_number).map((s) => (
                    <span
                      key={s.set_number}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg"
                      style={{
                        background: s.set_number === 0 ? "#1a1200" : s.reps === 0 ? "#1a0808" : "#111",
                        color: s.set_number === 0 ? "#ca8a04" : s.reps === 0 ? "#ef4444" : "#666",
                        border: `1px solid ${s.set_number === 0 ? "#2a1e00" : s.reps === 0 ? "#2a0808" : "#1e1e1e"}`,
                      }}
                    >
                      {s.set_number === 0 ? "W " : ""}{s.reps > 0 ? `${s.reps}×${s.weight_kg}kg` : "✗"}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
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
        const res = await fetch("/api/sessions");
        const data = await res.json();
        setSessions(Array.isArray(data) ? data.filter((s: Session) => s.completed) : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const byType: Record<DayType, number> = {} as Record<DayType, number>;
  for (const d of ALL_DAYS) byType[d] = 0;
  for (const s of sessions) byType[s.day_type] = (byType[s.day_type] ?? 0) + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-[#333] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pb-28">
      <div className="px-5 pt-14 pb-6 border-b border-[#141414]">
        <p className="text-[#444] text-sm mb-1">All sessions</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">History</h1>
        <p className="text-[#444] text-sm mt-1">{sessions.length} completed</p>
      </div>

      <div className="max-w-md mx-auto px-5 py-6">
        {sessions.length > 0 && (
          <div className="flex gap-5 mb-8 overflow-x-auto pb-1">
            {ALL_DAYS.map((d) => (
              <div key={d} className="flex-shrink-0 text-center">
                <p className="text-2xl font-bold" style={{ color: ACCENT[d].color }}>{byType[d]}</p>
                <p className="text-[#444] text-xs mt-0.5">{ACCENT[d].label}</p>
              </div>
            ))}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white font-semibold text-lg mb-2">Empty log</p>
            <p className="text-[#444] text-sm">Complete a session to see it here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
