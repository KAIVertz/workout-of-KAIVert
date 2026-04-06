"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PROGRAM, DayType, DAY_CYCLE, getNextDayType, Exercise } from "@/lib/program";

interface Session {
  id: number;
  date: string;
  day_type: DayType;
  completed: boolean;
}

interface LogEntry {
  exercise_name: string;
  set_number: number;
  reps: number | string;
  weight_kg: number | string;
}

const ACCENT: Record<DayType, { color: string; glow: string; text: string; border: string; bg: string }> = {
  push: {
    color: "#f97316",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.3)]",
    text: "text-orange-400",
    border: "border-orange-500",
    bg: "bg-orange-500",
  },
  pull: {
    color: "#3b82f6",
    glow: "shadow-[0_0_24px_rgba(59,130,246,0.3)]",
    text: "text-blue-400",
    border: "border-blue-500",
    bg: "bg-blue-500",
  },
  legs: {
    color: "#22c55e",
    glow: "shadow-[0_0_24px_rgba(34,197,94,0.3)]",
    text: "text-green-400",
    border: "border-green-500",
    bg: "bg-green-500",
  },
};

function SetRow({
  sessionId,
  exercise,
  setNum,
  saved,
  onSave,
}: {
  sessionId: number;
  exercise: Exercise;
  setNum: number;
  saved: LogEntry | undefined;
  onSave: (entry: LogEntry) => void;
}) {
  const [reps, setReps] = useState(saved?.reps?.toString() ?? "");
  const [weight, setWeight] = useState(saved?.weight_kg?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!saved);

  async function save() {
    if (!reps || !weight) return;
    setSaving(true);
    const entry: LogEntry = {
      exercise_name: exercise.name,
      set_number: setNum,
      reps: Number(reps),
      weight_kg: Number(weight),
    };
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, ...entry }),
    });
    setSaving(false);
    setDone(true);
    onSave(entry);
  }

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
        done ? "bg-[#1a2e1a] border border-green-900" : "bg-[#1a1a1a] border border-[#2a2a2a]"
      }`}
    >
      <span className="w-5 text-xs font-black text-[#444]">S{setNum}</span>

      <div className="flex items-center gap-2 flex-1">
        <input
          type="number"
          placeholder="—"
          value={reps}
          onChange={(e) => { setReps(e.target.value); setDone(false); }}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-14 bg-[#111] border border-[#333] text-white text-sm font-bold rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-[#555] transition-colors"
        />
        <span className="text-[#444] text-xs font-bold">reps</span>
        <span className="text-[#333] mx-1">·</span>
        <input
          type="number"
          placeholder="—"
          step="0.5"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setDone(false); }}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-14 bg-[#111] border border-[#333] text-white text-sm font-bold rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-[#555] transition-colors"
        />
        <span className="text-[#444] text-xs font-bold">kg</span>
      </div>

      <button
        onClick={save}
        disabled={saving || !reps || !weight}
        className={`text-xs font-black px-3 py-1.5 rounded-lg transition-all ${
          done
            ? "bg-green-900 text-green-400"
            : "bg-[#2a2a2a] text-[#888] hover:bg-[#333] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        }`}
      >
        {saving ? "..." : done ? "✓" : "LOG"}
      </button>
    </div>
  );
}

function ExerciseCard({
  sessionId,
  exercise,
  logs,
  onLogsUpdate,
  autoOpen,
}: {
  sessionId: number;
  exercise: Exercise;
  logs: LogEntry[];
  onLogsUpdate: (updated: LogEntry[]) => void;
  autoOpen: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);

  const savedForExercise = (setNum: number) =>
    logs.find((l) => l.exercise_name === exercise.name && l.set_number === setNum);

  const doneCount = Array.from({ length: exercise.sets }, (_, i) => i + 1).filter(
    (s) => savedForExercise(s)
  ).length;
  const allDone = doneCount === exercise.sets;

  function handleSave(entry: LogEntry) {
    const updated = [
      ...logs.filter((l) => !(l.exercise_name === entry.exercise_name && l.set_number === entry.set_number)),
      entry,
    ];
    onLogsUpdate(updated);
  }

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all ${
        allDone ? "border-green-900 bg-[#111]" : "border-[#222] bg-[#141414]"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            {allDone && <span className="text-green-400 text-xs">✓</span>}
            <p className={`font-bold text-sm ${allDone ? "text-[#666]" : "text-white"}`}>
              {exercise.name}
            </p>
          </div>
          <p className="text-xs text-[#555] mt-0.5">
            {exercise.sets} sets · {exercise.reps} reps · {exercise.weight}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-black px-2 py-0.5 rounded-full ${
              allDone ? "bg-green-900 text-green-400" : "bg-[#222] text-[#666]"
            }`}
          >
            {doneCount}/{exercise.sets}
          </span>
          <span className="text-[#444] text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1f1f1f]">
          <p className="text-xs text-[#555] italic mt-3 mb-3 leading-relaxed">{exercise.tip}</p>
          <div className="flex flex-col gap-2">
            {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((s) => (
              <SetRow
                key={s}
                sessionId={sessionId}
                exercise={exercise}
                setNum={s}
                saved={savedForExercise(s)}
                onSave={handleSave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CancelConfirm({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 px-4 pb-8">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md">
        <p className="text-white font-black text-lg mb-1">Cancel workout?</p>
        <p className="text-[#666] text-sm mb-6">All logged sets will be deleted.</p>
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 bg-[#222] text-white font-bold py-3.5 rounded-xl hover:bg-[#2a2a2a] transition-colors"
          >
            Keep going
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-950 border border-red-900 text-red-400 font-black py-3.5 rounded-xl hover:bg-red-900 transition-colors"
          >
            Cancel it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    return (Array.isArray(data) ? data : []) as Session[];
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/init", { method: "POST" });
        const data = await fetchSessions();
        const today = new Date().toISOString().split("T")[0];
        const todaySession = data.find((s: Session) => s.date === today && !s.completed);
        if (todaySession) {
          setActiveSession(todaySession);
          const logsRes = await fetch(`/api/sessions/${todaySession.id}`);
          setLogs(await logsRes.json());
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [fetchSessions]);

  async function startWorkout() {
    setStarting(true);
    try {
      const lastCompleted = sessions.find((s) => s.completed);
      const nextDay = getNextDayType(lastCompleted?.day_type as DayType | null);
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_type: nextDay }),
      });
      const session = await res.json();
      setActiveSession(session);
      setLogs([]);
      await fetchSessions();
    } finally {
      setStarting(false);
    }
  }

  async function finishWorkout() {
    if (!activeSession) return;
    await fetch(`/api/sessions/${activeSession.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    await fetchSessions();
    setActiveSession(null);
    setLogs([]);
  }

  async function cancelWorkout() {
    if (!activeSession) return;
    await fetch(`/api/sessions/${activeSession.id}`, { method: "DELETE" });
    await fetchSessions();
    setActiveSession(null);
    setLogs([]);
    setShowCancel(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] font-bold tracking-widest text-sm uppercase">Loading...</p>
      </div>
    );
  }

  const lastCompleted = sessions.find((s) => s.completed);
  const nextDay = getNextDayType(lastCompleted?.day_type as DayType | null);
  const dayType = activeSession?.day_type ?? nextDay;
  const currentProgram = PROGRAM[dayType];
  const a = ACCENT[dayType];

  const totalSets = currentProgram.exercises.reduce((acc, e) => acc + e.sets, 0);
  const doneSets = currentProgram.exercises.reduce((acc, e) => {
    return (
      acc +
      Array.from({ length: e.sets }, (_, i) => i + 1).filter((s) =>
        logs.find((l) => l.exercise_name === e.name && l.set_number === s)
      ).length
    );
  }, 0);

  // Find the first exercise that doesn't have all sets logged
  const firstIncompleteIdx = activeSession
    ? currentProgram.exercises.findIndex((ex) => {
        const done = Array.from({ length: ex.sets }, (_, i) => i + 1).filter((s) =>
          logs.find((l) => l.exercise_name === ex.name && l.set_number === s)
        ).length;
        return done < ex.sets;
      })
    : -1;

  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {showCancel && (
        <CancelConfirm
          onConfirm={cancelWorkout}
          onDismiss={() => setShowCancel(false)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-14 pb-6 relative">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: a.color }}
        />
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#555] text-xs font-semibold uppercase tracking-widest">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            <Link href="/history" className="text-[#555] text-xs font-semibold uppercase tracking-widest hover:text-white transition-colors">
              History →
            </Link>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h1
                className="text-5xl font-black tracking-tighter leading-none uppercase"
                style={{ color: a.color }}
              >
                {currentProgram.label}
              </h1>
              <p className="text-[#444] text-sm font-bold mt-1 uppercase tracking-wider">Day</p>
            </div>

            {/* Cycle indicator */}
            <div className="flex flex-col gap-1 items-end">
              {DAY_CYCLE.map((d) => (
                <div
                  key={d}
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full transition-all ${
                    d === dayType
                      ? `${ACCENT[d].text} bg-[#1a1a1a] border ${ACCENT[d].border}`
                      : "text-[#333] bg-transparent"
                  }`}
                >
                  {PROGRAM[d].label}
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {activeSession && (
            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold text-[#555] mb-1.5">
                <span>{doneSets} / {totalSets} sets</span>
                <span style={{ color: progressPct === 100 ? "#22c55e" : a.color }}>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: progressPct === 100 ? "#22c55e" : a.color,
                  }}
                />
              </div>
            </div>
          )}

          {!activeSession && lastCompleted && (
            <p className="text-[#444] text-xs font-semibold mt-3">
              Last:{" "}
              <span className={ACCENT[lastCompleted.day_type as DayType].text}>
                {PROGRAM[lastCompleted.day_type as DayType].label}
              </span>{" "}
              ·{" "}
              {new Date(lastCompleted.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-32">
        {/* Exercise list */}
        <div className="flex flex-col gap-2.5">
          {currentProgram.exercises.map((ex, idx) =>
            activeSession ? (
              <ExerciseCard
                key={ex.name}
                sessionId={activeSession.id}
                exercise={ex}
                logs={logs}
                onLogsUpdate={setLogs}
                autoOpen={idx === firstIncompleteIdx}
              />
            ) : (
              <div
                key={ex.name}
                className="border border-[#1f1f1f] rounded-xl px-4 py-3.5 bg-[#141414]"
              >
                <p className="font-bold text-[#666] text-sm">{ex.name}</p>
                <p className="text-xs text-[#444] mt-0.5">
                  {ex.sets} sets · {ex.reps} reps · {ex.weight}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Bottom CTA — fixed */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent">
        <div className="max-w-md mx-auto">
          {!activeSession ? (
            <button
              onClick={startWorkout}
              disabled={starting}
              className={`w-full font-black text-lg py-4 rounded-2xl uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 ${a.glow}`}
              style={{ background: a.color, color: "#000" }}
            >
              {starting ? "LOADING..." : `START ${currentProgram.label}`}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(true)}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] font-bold py-4 rounded-2xl hover:border-red-900 hover:text-red-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={finishWorkout}
                className={`flex-[2] font-black text-lg py-4 rounded-2xl uppercase tracking-wider transition-all active:scale-95 ${
                  progressPct === 100
                    ? "bg-green-500 text-black shadow-[0_0_24px_rgba(34,197,94,0.4)]"
                    : "bg-[#1a1a1a] border border-[#2a2a2a] text-white"
                }`}
              >
                {progressPct === 100 ? "DONE ✓" : `FINISH (${progressPct}%)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
