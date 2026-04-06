"use client";

import { useEffect, useState, useCallback } from "react";
import { PROGRAM, DayType, DAY_CYCLE, getNextDayType, Exercise } from "@/lib/program";
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
  reps: number | string;
  weight_kg: number | string;
}

const ACCENT: Record<DayType, { color: string; glow: string; text: string; border: string }> = {
  push: { color: "#f97316", glow: "shadow-[0_0_32px_rgba(249,115,22,0.35)]", text: "text-orange-400", border: "border-orange-500" },
  pull: { color: "#3b82f6", glow: "shadow-[0_0_32px_rgba(59,130,246,0.35)]", text: "text-blue-400", border: "border-blue-500" },
  legs: { color: "#22c55e", glow: "shadow-[0_0_32px_rgba(34,197,94,0.35)]", text: "text-green-400", border: "border-green-500" },
};

function coachLine(sessions: Session[], dayType: DayType, streak: number): string {
  const today = new Date();
  if (today.getDay() === 0) return "Sunday. Rest day. Recover.";
  const last = sessions.find((s) => s.completed);
  if (!last) return "First session. Let's build.";
  const diff = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  if (diff === 0) return "Session locked in. See you tomorrow.";
  if (streak >= 5) return `${streak}-day streak. You're dialed in.`;
  if (streak >= 3) return `${streak} days straight. Keep the fire.`;
  if (diff === 1) return "24h recovery done. Body's primed.";
  if (diff === 2) return "2 days off. Muscles rebuilt. Hit it.";
  return `${diff} days off — time to get back.`;
}

function computeCurrentStreak(sessions: Session[]): number {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (dates.size === 0) return 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  let streak = dates.has(todayStr) ? 1 : 0;
  const d = new Date(today);
  d.setDate(d.getDate() - (dates.has(todayStr) ? 1 : 0));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (d.getDay() === 0) { d.setDate(d.getDate() - 1); continue; }
    if (dates.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function SetRow({
  sessionId, exercise, setNum, saved, prevLog, onSave,
}: {
  sessionId: number;
  exercise: Exercise;
  setNum: number;
  saved: LogEntry | undefined;
  prevLog: LogEntry | undefined;
  onSave: (entry: LogEntry) => void;
}) {
  const [reps, setReps] = useState(saved?.reps?.toString() ?? "");
  const [weight, setWeight] = useState(saved?.weight_kg?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!saved);

  const isPR = done && prevLog &&
    Number(weight) > Number(prevLog.weight_kg);

  async function save() {
    if (!reps || !weight) return;
    setSaving(true);
    const entry: LogEntry = { exercise_name: exercise.name, set_number: setNum, reps: Number(reps), weight_kg: Number(weight) };
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
    <div className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all border ${
      done ? "bg-[#0f1f0f] border-green-900/50" : "bg-[#1a1a1a] border-[#222]"
    }`}>
      <div className="flex flex-col items-center w-6 shrink-0">
        <span className="text-[10px] font-black text-[#444]">S{setNum}</span>
        {prevLog && (
          <span className="text-[8px] text-[#333] font-mono leading-tight">
            {prevLog.reps}×{prevLog.weight_kg}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1">
        <input
          type="number"
          placeholder={prevLog ? String(prevLog.reps) : "—"}
          value={reps}
          onChange={(e) => { setReps(e.target.value); setDone(false); }}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-14 bg-[#111] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-[#444] transition-colors"
        />
        <span className="text-[#333] text-xs font-bold">×</span>
        <input
          type="number"
          placeholder={prevLog ? String(prevLog.weight_kg) : "—"}
          step="0.5"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setDone(false); }}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-14 bg-[#111] border border-[#2a2a2a] text-white text-sm font-bold rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-[#444] transition-colors"
        />
        <span className="text-[#444] text-xs font-bold">kg</span>
      </div>

      {isPR && <span className="text-[9px] font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-md">PR</span>}

      <button
        onClick={save}
        disabled={saving || !reps || !weight}
        className={`text-xs font-black px-3 py-1.5 rounded-lg transition-all shrink-0 ${
          done ? "bg-green-900/60 text-green-400" : "bg-[#222] text-[#666] hover:bg-[#2a2a2a] hover:text-white disabled:opacity-30"
        }`}
      >
        {saving ? "…" : done ? "✓" : "LOG"}
      </button>
    </div>
  );
}

function ExerciseCard({
  sessionId, exercise, logs, prevLogs, onLogsUpdate, autoOpen,
}: {
  sessionId: number;
  exercise: Exercise;
  logs: LogEntry[];
  prevLogs: LogEntry[];
  onLogsUpdate: (updated: LogEntry[]) => void;
  autoOpen: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);

  const saved = (s: number) => logs.find((l) => l.exercise_name === exercise.name && l.set_number === s);
  const prev = (s: number) => prevLogs.find((l) => l.exercise_name === exercise.name && l.set_number === s);
  const doneCount = Array.from({ length: exercise.sets }, (_, i) => i + 1).filter((s) => saved(s)).length;
  const allDone = doneCount === exercise.sets;

  const prevMaxWeight = prevLogs
    .filter((l) => l.exercise_name === exercise.name)
    .reduce((max, l) => Math.max(max, Number(l.weight_kg)), 0);

  function handleSave(entry: LogEntry) {
    onLogsUpdate([
      ...logs.filter((l) => !(l.exercise_name === entry.exercise_name && l.set_number === entry.set_number)),
      entry,
    ]);
  }

  return (
    <div className={`rounded-xl overflow-hidden border transition-all ${allDone ? "border-green-900/40 bg-[#0f1a0f]" : "border-[#1f1f1f] bg-[#141414]"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            {allDone && <span className="text-green-400 text-xs">✓</span>}
            <p className={`font-bold text-sm ${allDone ? "text-[#555]" : "text-white"}`}>{exercise.name}</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#444]">{exercise.sets}×{exercise.reps} · {exercise.weight}</p>
            {prevMaxWeight > 0 && !allDone && (
              <>
                <span className="text-[#2a2a2a]">·</span>
                <p className="text-[10px] text-[#444] font-mono">prev {prevMaxWeight}kg</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${allDone ? "bg-green-900/40 text-green-400" : "bg-[#1a1a1a] text-[#555]"}`}>
            {doneCount}/{exercise.sets}
          </span>
          <span className="text-[#333] text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1a1a1a]">
          <p className="text-xs text-[#444] italic mt-3 mb-3 leading-relaxed">{exercise.tip}</p>
          <div className="flex flex-col gap-2">
            {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((s) => (
              <SetRow
                key={s}
                sessionId={sessionId}
                exercise={exercise}
                setNum={s}
                saved={saved(s)}
                prevLog={prev(s)}
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
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 px-4 pb-10">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md">
        <p className="text-white font-black text-lg mb-1">Cancel workout?</p>
        <p className="text-[#555] text-sm mb-6">All logged sets will be deleted.</p>
        <div className="flex gap-3">
          <button onClick={onDismiss} className="flex-1 bg-[#1f1f1f] border border-[#2a2a2a] text-white font-bold py-3.5 rounded-xl hover:bg-[#252525] transition-colors">
            Keep going
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-950/60 border border-red-900/50 text-red-400 font-black py-3.5 rounded-xl hover:bg-red-900/40 transition-colors">
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
  const [prevLogs, setPrevLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [];
    setSessions(arr);
    return arr as Session[];
  }, []);

  // Fetch previous session logs for the given day type
  async function fetchPrevLogs(dayType: DayType, excludeId: number, allSessions: Session[]) {
    const prev = allSessions.find((s) => s.completed && s.day_type === dayType && s.id !== excludeId);
    if (!prev) return;
    const res = await fetch(`/api/sessions/${prev.id}`);
    setPrevLogs(await res.json());
  }

  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/init", { method: "POST" });
        const data = await fetchSessions();
        const today = new Date().toISOString().split("T")[0];
        const todaySession = data.find((s: Session) => s.date === today && !s.completed);
        if (todaySession) {
          setActiveSession(todaySession);
          const [logsRes] = await Promise.all([fetch(`/api/sessions/${todaySession.id}`)]);
          setLogs(await logsRes.json());
          await fetchPrevLogs(todaySession.day_type, todaySession.id, data);
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const updated = await fetchSessions();
      await fetchPrevLogs(session.day_type, session.id, updated);
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
    setPrevLogs([]);
  }

  async function cancelWorkout() {
    if (!activeSession) return;
    await fetch(`/api/sessions/${activeSession.id}`, { method: "DELETE" });
    await fetchSessions();
    setActiveSession(null);
    setLogs([]);
    setPrevLogs([]);
    setShowCancel(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] font-bold tracking-widest text-sm uppercase animate-pulse">Loading...</p>
      </div>
    );
  }

  const lastCompleted = sessions.find((s) => s.completed);
  const dayType = activeSession?.day_type ?? getNextDayType(lastCompleted?.day_type as DayType | null);
  const currentProgram = PROGRAM[dayType];
  const a = ACCENT[dayType];
  const streak = computeCurrentStreak(sessions);

  const totalSets = currentProgram.exercises.reduce((acc, e) => acc + e.sets, 0);
  const doneSets = currentProgram.exercises.reduce((acc, e) =>
    acc + Array.from({ length: e.sets }, (_, i) => i + 1).filter((s) =>
      logs.find((l) => l.exercise_name === e.name && l.set_number === s)
    ).length, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const firstIncompleteIdx = activeSession
    ? currentProgram.exercises.findIndex((ex) =>
        Array.from({ length: ex.sets }, (_, i) => i + 1).filter((s) =>
          logs.find((l) => l.exercise_name === ex.name && l.set_number === s)
        ).length < ex.sets
      )
    : -1;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {showCancel && <CancelConfirm onConfirm={cancelWorkout} onDismiss={() => setShowCancel(false)} />}

      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: a.color }} />

      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#444] text-[10px] font-bold uppercase tracking-widest mb-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none" style={{ color: a.color }}>
                {currentProgram.label}
              </h1>
              <p className="text-[#333] text-xs font-bold uppercase tracking-wider mt-1">Day</p>
            </div>

            <div className="flex flex-col items-end gap-1 pt-1">
              {/* Streak pill */}
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-2.5 py-1">
                  <span className="text-[10px]">🔥</span>
                  <span className="text-white text-xs font-black">{streak}</span>
                  <span className="text-[#555] text-[9px] font-bold uppercase">streak</span>
                </div>
              )}
              {/* Cycle dots */}
              <div className="flex gap-1 mt-1">
                {DAY_CYCLE.map((d) => (
                  <div
                    key={d}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      background: d === dayType ? a.color : "#222",
                      boxShadow: d === dayType ? `0 0 6px ${a.color}88` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Coach line */}
          <p className="text-[#444] text-xs font-medium italic mt-3">
            {coachLine(sessions, dayType, streak)}
          </p>

          {/* Progress bar */}
          {activeSession && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-black text-[#444] mb-1 uppercase tracking-wider">
                <span>{doneSets} / {totalSets} sets</span>
                <span style={{ color: pct === 100 ? "#22c55e" : a.color }}>{pct}%</span>
              </div>
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : a.color }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exercises */}
      <div className="max-w-md mx-auto px-4 pb-44 space-y-2.5">
        {currentProgram.exercises.map((ex, idx) =>
          activeSession ? (
            <ExerciseCard
              key={ex.name}
              sessionId={activeSession.id}
              exercise={ex}
              logs={logs}
              prevLogs={prevLogs}
              onLogsUpdate={setLogs}
              autoOpen={idx === firstIncompleteIdx}
            />
          ) : (
            <div key={ex.name} className="border border-[#1a1a1a] rounded-xl px-4 py-3.5 bg-[#111]">
              <p className="font-bold text-[#555] text-sm">{ex.name}</p>
              <p className="text-[10px] text-[#333] mt-0.5">{ex.sets} sets · {ex.reps} reps · {ex.weight}</p>
            </div>
          )
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-24 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent z-30">
        <div className="max-w-md mx-auto">
          {!activeSession ? (
            <button
              onClick={startWorkout}
              disabled={starting}
              className={`w-full font-black text-base py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 text-black ${a.glow}`}
              style={{ background: a.color }}
            >
              {starting ? "LOADING…" : `START ${currentProgram.label}`}
            </button>
          ) : (
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowCancel(true)}
                className="flex-1 bg-[#141414] border border-[#222] text-[#555] font-bold py-4 rounded-2xl hover:border-red-900/50 hover:text-red-500 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={finishWorkout}
                className={`flex-[2] font-black py-4 rounded-2xl uppercase tracking-wider transition-all active:scale-95 text-sm ${
                  pct === 100
                    ? "text-black shadow-[0_0_24px_rgba(34,197,94,0.4)]"
                    : "bg-[#141414] border border-[#222] text-white"
                }`}
                style={pct === 100 ? { background: "#22c55e" } : undefined}
              >
                {pct === 100 ? "DONE ✓" : `FINISH (${pct}%)`}
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
