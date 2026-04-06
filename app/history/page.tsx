"use client";

import { useEffect, useState } from "react";
import { PROGRAM, DayType } from "@/lib/program";

interface Session {
  id: number;
  date: string;
  day_type: DayType;
  completed: boolean;
  created_at: string;
}

interface LogEntry {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
}

const COLOR = {
  push: { bg: "bg-orange-500", badge: "bg-orange-100 text-orange-700" },
  pull: { bg: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
  legs: { bg: "bg-green-500", badge: "bg-green-100 text-green-700" },
};

function SessionCard({ session }: { session: Session }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const c = COLOR[session.day_type];

  async function fetchLogs() {
    if (logs.length > 0) return;
    const res = await fetch(`/api/sessions/${session.id}`);
    setLogs(await res.json());
  }

  function toggle() {
    if (!open) fetchLogs();
    setOpen((o) => !o);
  }

  // Group logs by exercise
  const byExercise: Record<string, LogEntry[]> = {};
  for (const log of logs) {
    if (!byExercise[log.exercise_name]) byExercise[log.exercise_name] = [];
    byExercise[log.exercise_name].push(log);
  }

  const totalSets = PROGRAM[session.day_type].exercises.reduce((a, e) => a + e.sets, 0);
  const loggedSets = logs.length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${c.badge}`}>
            {PROGRAM[session.day_type].label}
          </span>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">
              {new Date(session.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            {loggedSets > 0 && (
              <p className="text-xs text-gray-400">{loggedSets} / {totalSets} sets logged</p>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {Object.keys(byExercise).length === 0 ? (
            <p className="text-sm text-gray-400 pt-3">No sets logged.</p>
          ) : (
            Object.entries(byExercise).map(([name, sets]) => (
              <div key={name} className="mt-3">
                <p className="text-xs font-bold text-gray-600 mb-1">{name}</p>
                <div className="flex flex-wrap gap-1">
                  {sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((s) => (
                      <span
                        key={s.set_number}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
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
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.filter((s: Session) => s.completed));
      setLoading(false);
    }
    load();
  }, []);

  // Stats
  const totalWorkouts = sessions.length;
  const byType = { push: 0, pull: 0, legs: 0 };
  for (const s of sessions) byType[s.day_type]++;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 pt-12 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1">
            <a href="/" className="text-white/70 text-sm hover:text-white transition-colors">
              ← Today
            </a>
          </div>
          <h1 className="text-3xl font-black tracking-tight">HISTORY</h1>
          <p className="text-white/70 text-sm mt-1">{totalWorkouts} workouts completed</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Stats row */}
        {totalWorkouts > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["push", "pull", "legs"] as DayType[]).map((d) => (
              <div key={d} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <p className={`text-2xl font-black ${COLOR[d].badge.split(" ")[1]}`}>{byType[d]}</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{PROGRAM[d].label}</p>
              </div>
            ))}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💪</p>
            <p className="text-gray-500 font-medium">No workouts yet.</p>
            <p className="text-gray-400 text-sm mt-1">Complete your first session!</p>
            <a href="/" className="inline-block mt-4 bg-gray-900 text-white font-bold px-6 py-3 rounded-2xl text-sm">
              Start Now
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
