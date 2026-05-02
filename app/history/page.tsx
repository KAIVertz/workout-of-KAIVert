"use client";

import { useEffect, useState } from "react";
import { ACCENT, DayType, localDateStr } from "@/lib/program";
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

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

function SessionRow({ session }: { session: Session }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const a = ACCENT[session.day_type] ?? { color: "#666", label: session.day_type };

  async function toggle() {
    if (!open && !logs.length) {
      const res = await fetch(`/api/sessions/${session.id}`);
      setLogs(await res.json());
    }
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
    <div className="border-b border-[#0d0d0d]">
      <button onClick={toggle} className="w-full flex items-center justify-between py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: a.color }} />
          <div>
            <p className="text-white text-sm">
              {new Date(session.date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "short", day: "numeric",
              })}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: a.color }}>{a.label}</span>
              {session.duration_seconds && (
                <span className="text-[#444] text-xs">{fmtDur(session.duration_seconds)}</span>
              )}
              {open && workSets > 0 && (
                <span className="text-[#444] text-xs">{workSets} sets · {volume}kg</span>
              )}
            </div>
          </div>
        </div>
        <span className="text-[#333] text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="pb-4 pl-6">
          {Object.keys(byExercise).length === 0 ? (
            <p className="text-[#444] text-sm">No sets logged.</p>
          ) : (
            Object.entries(byExercise).map(([name, sets]) => (
              <div key={name} className="mb-3">
                <p className="text-[#444] text-xs uppercase tracking-wider mb-1.5">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sets.sort((a, b) => a.set_number - b.set_number).map((s) => (
                    <span
                      key={s.set_number}
                      className="text-xs font-mono px-2 py-1 rounded-lg"
                      style={{
                        background: s.set_number === 0 ? "#1a1200" : "#0d0d0d",
                        color: s.set_number === 0 ? "#ca8a04" : s.reps === 0 ? "#555" : "#888",
                        border: "1px solid #1a1a1a",
                      }}
                    >
                      {s.set_number === 0 ? "W " : ""}{s.reps > 0 ? `${s.reps}×${s.weight_kg}kg` : "—"}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#333] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="px-5 pt-14 pb-6 border-b border-[#111]">
        <p className="text-[#444] text-sm mb-1">{sessions.length} sessions</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">History</h1>
      </div>

      <div className="max-w-md mx-auto px-5 py-6">
        {sessions.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-white font-semibold mb-2">Empty log</p>
            <p className="text-[#444] text-sm">Complete a session to see it here.</p>
          </div>
        ) : (
          sessions.map((s) => <SessionRow key={s.id} session={s} />)
        )}
      </div>
      <BottomNav />
    </div>
  );
}
