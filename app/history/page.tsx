"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROGRAM, DayType } from "@/lib/program";

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

const ACCENT: Record<DayType, { text: string; bg: string; border: string }> = {
  push: { text: "text-orange-400", bg: "bg-orange-950", border: "border-orange-900" },
  pull: { text: "text-blue-400", bg: "bg-blue-950", border: "border-blue-900" },
  legs: { text: "text-green-400", bg: "bg-green-950", border: "border-green-900" },
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
  const loggedSets = logs.length;

  return (
    <div className="border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#141414]">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-black px-2.5 py-0.5 rounded-full ${a.bg} ${a.text} border ${a.border}`}
          >
            {PROGRAM[session.day_type].label}
          </span>
          <div className="text-left">
            <p className="font-bold text-white text-sm">
              {new Date(session.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            {open && loggedSets > 0 && (
              <p className="text-xs text-[#555]">{loggedSets} / {totalSets} sets logged</p>
            )}
          </div>
        </div>
        <span className="text-[#444] text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1f1f1f]">
          {Object.keys(byExercise).length === 0 ? (
            <p className="text-sm text-[#555] pt-3">No sets logged.</p>
          ) : (
            Object.entries(byExercise).map(([name, sets]) => (
              <div key={name} className="mt-3">
                <p className="text-xs font-bold text-[#666] mb-1.5 uppercase tracking-wider">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((s) => (
                      <span
                        key={s.set_number}
                        className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] px-2.5 py-1 rounded-lg font-mono"
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

  const totalWorkouts = sessions.length;
  const byType: Record<DayType, number> = { push: 0, pull: 0, legs: 0 };
  for (const s of sessions) byType[s.day_type]++;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] font-bold tracking-widest text-sm uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <div className="px-4 pt-14 pb-6 border-b border-[#1a1a1a]">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="text-[#555] text-xs font-semibold uppercase tracking-widest hover:text-white transition-colors mb-4 inline-block"
          >
            ← Today
          </Link>
          <h1 className="text-5xl font-black tracking-tighter uppercase text-white">
            History
          </h1>
          <p className="text-[#444] text-sm font-bold mt-1">
            {totalWorkouts} workout{totalWorkouts !== 1 ? "s" : ""} completed
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Stats */}
        {totalWorkouts > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["push", "pull", "legs"] as DayType[]).map((d) => (
              <div
                key={d}
                className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center"
              >
                <p className={`text-3xl font-black ${ACCENT[d].text}`}>{byType[d]}</p>
                <p className="text-xs text-[#555] font-bold mt-1 uppercase tracking-wider">
                  {PROGRAM[d].label}
                </p>
              </div>
            ))}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💪</p>
            <p className="text-white font-black text-xl uppercase tracking-tight">No workouts yet</p>
            <p className="text-[#555] text-sm mt-2 mb-6">Get to work.</p>
            <Link
              href="/"
              className="inline-block bg-white text-black font-black px-8 py-3.5 rounded-2xl uppercase tracking-wider text-sm hover:bg-[#ddd] transition-colors"
            >
              Start Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
