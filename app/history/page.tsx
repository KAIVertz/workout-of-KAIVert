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

  const workSets = logs.filter((l) => l.set_number > 0).length;
  const maxWeight = logs.length ? Math.max(...logs.map((l) => Number(l.weight_kg))) : null;
  const volume = logs.filter((l) => l.set_number > 0).reduce((acc, l) => acc + Number(l.reps) * Number(l.weight_kg), 0);

  return (
    <div className="border border-[#1a1a1a] rounded-2xl overflow-hidden bg-[#0f0f0f]">
      <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.015] transition-colors text-left">
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: a.color + "18", border: `1px solid ${a.color}35` }}
        >
          <span className="text-[9px] font-black" style={{ color: a.color }}>{a.label}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">
            {new Date(session.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[9px] font-black uppercase" style={{ color: a.color }}>{a.label}</span>
            {open && workSets > 0 && (
              <>
                <span className="text-[#2a2a2a]">·</span>
                <span className="text-[#444] text-[9px] font-mono">{workSets} sets</span>
                {maxWeight && <><span className="text-[#2a2a2a]">·</span><span className="text-[#444] text-[9px] font-mono">{maxWeight}kg top</span></>}
                {volume > 0 && <><span className="text-[#2a2a2a]">·</span><span className="text-[#444] text-[9px] font-mono">{volume.toLocaleString()}kg vol</span></>}
              </>
            )}
            {session.duration_seconds && (
              <><span className="text-[#2a2a2a]">·</span><span className="text-[#444] text-[9px] font-mono">{fmtDuration(session.duration_seconds)}</span></>
            )}
          </div>
        </div>
        <span className="text-[#333] text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#141414]">
          {!Object.keys(byExercise).length ? (
            <p className="text-[#444] text-sm pt-3">No sets logged.</p>
          ) : (
            Object.entries(byExercise).map(([name, sets]) => (
              <div key={name} className="mt-3">
                <p className="text-[8px] font-black text-[#444] uppercase tracking-widest mb-1.5">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sets.sort((a, b) => a.set_number - b.set_number).map((s) => (
                    <span
                      key={s.set_number}
                      className="text-xs font-mono px-2 py-1 rounded-lg"
                      style={{
                        background: s.set_number === 0 ? "#1a1500" : "#111",
                        border: `1px solid ${s.set_number === 0 ? "#332900" : "#1f1f1f"}`,
                        color: s.set_number === 0 ? "#ca8a04" : "#777",
                      }}
                    >
                      {s.set_number === 0 ? "W " : ""}{s.reps}×{s.weight_kg}kg
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
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] text-sm font-bold tracking-widest uppercase animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-36">
      <div className="h-0.5 bg-[#1a1a1a]" />

      <div className="px-4 pt-10 pb-5 border-b border-[#141414]">
        <div className="max-w-md mx-auto">
          <p className="text-[#444] text-[10px] font-bold uppercase tracking-widest mb-1">All sessions</p>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Session Log</h1>
          <p className="text-[#444] text-sm mt-1">{sessions.length} completed</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5">
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ALL_DAYS.map((d) => (
              <div key={d} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-3 text-center">
                <p className="font-black text-xl" style={{ color: ACCENT[d].color }}>{byType[d]}</p>
                <p className="text-[8px] font-black text-[#444] uppercase tracking-widest mt-0.5">{ACCENT[d].label}</p>
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
            {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
