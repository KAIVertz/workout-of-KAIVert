"use client";

import { useEffect, useState } from "react";
import { PROGRAM, DayType } from "@/lib/program";
import { BottomNav } from "@/components/BottomNav";

interface Session {
  id: number;
  date: string;
  day_type: DayType;
  completed: boolean;
}

interface LogEntry {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
}

const ACCENT: Record<DayType, { text: string; bg: string; border: string; color: string }> = {
  push: { text: "text-orange-400", bg: "bg-orange-950/40", border: "border-orange-900/50", color: "#f97316" },
  pull: { text: "text-blue-400", bg: "bg-blue-950/40", border: "border-blue-900/50", color: "#3b82f6" },
  legs: { text: "text-green-400", bg: "bg-green-950/40", border: "border-green-900/50", color: "#22c55e" },
};

function SessionCard({ session }: { session: Session }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const a = ACCENT[session.day_type];

  async function fetchLogs() {
    if (logs.length > 0) return;
    const res = await fetch(`/api/sessions/${session.id}`);
    setLogs(await res.json());
  }

  function toggle() {
    if (!open) fetchLogs();
    setOpen((o) => !o);
  }

  const byExercise: Record<string, LogEntry[]> = {};
  for (const log of logs) {
    if (!byExercise[log.exercise_name]) byExercise[log.exercise_name] = [];
    byExercise[log.exercise_name].push(log);
  }

  const totalSets = PROGRAM[session.day_type].exercises.reduce((acc, e) => acc + e.sets, 0);
  const maxWeight = logs.length > 0 ? Math.max(...logs.map((l) => Number(l.weight_kg))) : null;

  return (
    <div className="border border-[#1a1a1a] rounded-2xl overflow-hidden bg-[#111]">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${a.bg} border ${a.border}`}
        >
          <span className={`text-[10px] font-black ${a.text}`}>{PROGRAM[session.day_type].label[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">
            {new Date(session.date).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            })}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-black uppercase ${a.text}`}>{PROGRAM[session.day_type].label}</span>
            {logs.length > 0 && (
              <>
                <span className="text-[#333]">·</span>
                <span className="text-[#444] text-[10px] font-mono">{logs.length}/{totalSets} sets</span>
                {maxWeight && (
                  <>
                    <span className="text-[#333]">·</span>
                    <span className="text-[#444] text-[10px] font-mono">{maxWeight}kg top</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <span className="text-[#333] text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1a1a1a]">
          {Object.keys(byExercise).length === 0 ? (
            <p className="text-sm text-[#444] pt-3">No sets logged.</p>
          ) : (
            Object.entries(byExercise).map(([name, sets]) => (
              <div key={name} className="mt-3">
                <p className="text-[9px] font-black text-[#555] uppercase tracking-widest mb-1.5">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((s) => (
                      <span
                        key={s.set_number}
                        className="text-xs bg-[#1a1a1a] border border-[#222] text-[#888] px-2.5 py-1 rounded-lg font-mono"
                      >
                        {s.reps}×{s.weight_kg}kg
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

  const byType: Record<DayType, number> = { push: 0, pull: 0, legs: 0 };
  for (const s of sessions) byType[s.day_type]++;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] font-bold tracking-widest text-sm uppercase animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-36">
      <div className="h-0.5 w-full bg-[#1f1f1f]" />

      {/* Header */}
      <div className="px-4 pt-10 pb-5 border-b border-[#141414]">
        <div className="max-w-md mx-auto">
          <p className="text-[#444] text-[10px] font-bold uppercase tracking-widest mb-1">All sessions</p>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Session Log</h1>
          <p className="text-[#444] text-sm font-medium mt-1">{sessions.length} completed</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5">
        {/* Stats row */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {(["push", "pull", "legs"] as DayType[]).map((d) => (
              <div key={d} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-3 text-center">
                <p className="font-black text-2xl" style={{ color: ACCENT[d].color }}>{byType[d]}</p>
                <p className="text-[#444] text-[9px] font-black uppercase tracking-widest mt-0.5">
                  {PROGRAM[d].label}
                </p>
              </div>
            ))}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-white font-black text-xl uppercase">Empty log</p>
            <p className="text-[#444] text-sm mt-2">Complete a session to see it here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
