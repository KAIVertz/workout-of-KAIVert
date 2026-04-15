"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  PROGRAM, DayType, ACCENT, WEEKLY_SCHEDULE, DAY_NAMES,
  getTodayDayType, Exercise,
} from "@/lib/program";
import { BottomNav } from "@/components/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
  id: number;
  date: string;
  day_type: DayType;
  completed: boolean;
  created_at: string;
  duration_seconds?: number;
}

interface LogEntry {
  exercise_name: string;
  set_number: number; // 0 = warmup
  reps: number | string;
  weight_kg: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

function calcVolume(logs: LogEntry[]) {
  return logs
    .filter((l) => l.set_number > 0 && Number(l.reps) > 0) // exclude warmup + failed sets
    .reduce((acc, l) => acc + Number(l.reps) * Number(l.weight_kg), 0);
}

// Parse default weight from program string: "7-13kg" → 7, "25kg band" → 25, "Band on wall" → 0
function parseWeight(w: string): number {
  const m = w.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

// Parse default reps from program string: "10-12" → 10, "12" → 12, "10 each" → 10
function parseReps(r: string): number {
  const m = r.match(/(\d+)/);
  return m ? parseInt(m[1]) : 10;
}

function computeStreak(sessions: Session[]) {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (!dates.size) return 0;
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

function coachLine(sessions: Session[], dayType: DayType | null, streak: number) {
  if (!dayType) return "Sunday. No weights. Sleep, eat, grow.";
  const last = sessions.find((s) => s.completed);
  if (!last) return "Day one. Let's build.";
  const diff = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  if (diff === 0) return "Session locked in. Protein up. Recover.";
  if (streak >= 5) return `${streak}-day streak. You're in the zone.`;
  if (streak >= 3) return `${streak} days straight. Keep it going.`;
  if (diff === 1) return "24h rest done. Body is primed. Let's go.";
  if (diff === 2) return "2 days off. Muscles rebuilt. Hit it.";
  return `${diff} days off — don't lose momentum.`;
}

// ─── Set Row (one-tap flow) ────────────────────────────────────────────────────
function SetRow({
  isWarmup, setNum, sessionId, exerciseName,
  saved, prevLog, defaultWeight, defaultReps,
  onSaved, onUnsaved, onRestStart,
}: {
  isWarmup: boolean;
  setNum: number;
  sessionId: number;
  exerciseName: string;
  saved: LogEntry | undefined;
  prevLog: LogEntry | undefined;
  defaultWeight: number;
  defaultReps: number;
  onSaved: (entry: LogEntry) => void;
  onUnsaved: (setNum: number) => void;
  onRestStart: () => void;
}) {
  const [editReps, setEditReps] = useState(String(defaultReps));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const isDone = !!saved && Number(saved.reps) > 0;
  const isFailed = !!saved && Number(saved.reps) === 0;
  const label = isWarmup ? "W" : String(setNum);

  const prevLabel = prevLog && Number(prevLog.reps) > 0
    ? `${prevLog.reps}×${prevLog.weight_kg}kg`
    : "—";

  async function saveEntry(reps: number) {
    setBusy(true);
    const entry: LogEntry = { exercise_name: exerciseName, set_number: setNum, reps, weight_kg: defaultWeight };
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, ...entry }),
    });
    setBusy(false);
    onSaved(entry);
    if (!isWarmup && reps > 0) onRestStart();
  }

  async function undoEntry() {
    setBusy(true);
    await fetch("/api/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, exercise_name: exerciseName, set_number: setNum }),
    });
    setBusy(false);
    setEditing(false);
    setEditReps(String(defaultReps));
    onUnsaved(setNum);
  }

  async function confirmEdit() {
    const reps = Math.max(1, parseInt(editReps) || 1);
    setBusy(true);
    const entry: LogEntry = { exercise_name: exerciseName, set_number: setNum, reps, weight_kg: defaultWeight };
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, ...entry }),
    });
    setBusy(false);
    setEditing(false);
    onSaved(entry);
  }

  // ── Done ──
  if (isDone && !editing) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 bg-[#081408] border-l-2 border-green-800 cursor-pointer active:opacity-70"
        onClick={() => !busy && setEditing(true)}
      >
        <span className="text-xs font-black text-green-500 w-5 text-center shrink-0">{label}</span>
        <span className="flex-1 text-xs font-mono text-green-400">
          {saved!.reps} reps · {defaultWeight}kg
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); undoEntry(); }}
          disabled={busy}
          className="text-[10px] font-black text-[#3a3a3a] hover:text-red-400 transition-colors px-1 py-0.5"
        >
          undo
        </button>
      </div>
    );
  }

  // ── Edit mode ──
  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0a180a]">
        <span className="text-xs font-black text-green-500 w-5 text-center shrink-0">{label}</span>
        <span className="text-[10px] text-[#555] font-mono shrink-0">{defaultWeight}kg</span>
        <input
          type="number"
          value={editReps}
          onChange={(e) => setEditReps(e.target.value)}
          autoFocus
          className="w-14 text-xs font-black text-center rounded-lg px-2 py-1.5 bg-[#1a1a1a] border border-[#3a3a3a] text-white focus:outline-none focus:border-green-700"
        />
        <span className="text-[10px] text-[#444] shrink-0">reps</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={confirmEdit}
            disabled={busy}
            className="text-[11px] font-black text-green-400 hover:text-green-300 transition-colors px-2.5 py-1 bg-green-900/30 rounded-lg disabled:opacity-40"
          >
            {busy ? "…" : "save"}
          </button>
          <button
            onClick={() => { setEditing(false); setEditReps(String(saved?.reps ?? defaultReps)); }}
            className="text-[10px] font-black text-[#444] hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // ── Failed ──
  if (isFailed) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#140808] border-l-2 border-red-900/50">
        <span className="text-xs font-black text-red-500/60 w-5 text-center shrink-0">{label}</span>
        <span className="flex-1 text-xs text-red-400/60 font-mono">too hard</span>
        <button
          onClick={undoEntry}
          disabled={busy}
          className="text-[10px] font-black text-[#3a3a3a] hover:text-red-400 transition-colors px-1 py-0.5"
        >
          undo
        </button>
      </div>
    );
  }

  // ── Pending ──
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${isWarmup ? "bg-[#111]" : "bg-[#0f0f0f]"}`}>
      <span className={`text-xs font-black w-5 text-center shrink-0 ${isWarmup ? "text-yellow-600/70" : "text-[#555]"}`}>
        {label}
      </span>
      <span className="text-[10px] text-[#333] font-mono w-16 shrink-0">{prevLabel}</span>
      <input
        type="number"
        value={editReps}
        onChange={(e) => setEditReps(e.target.value)}
        className="w-14 text-xs font-black text-center rounded-lg px-1 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white focus:outline-none focus:border-[#444]"
      />
      <span className="text-[10px] text-[#444] shrink-0">reps</span>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => saveEntry(0)}
          disabled={busy}
          title="Too hard"
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#180808] border border-red-900/30 text-red-500/50 hover:border-red-700 hover:text-red-400 transition-all text-xs font-black disabled:opacity-30"
        >
          ✗
        </button>
        <button
          onClick={() => saveEntry(Math.max(1, parseInt(editReps) || 1))}
          disabled={busy}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs font-black disabled:opacity-30 ${
            isWarmup
              ? "bg-yellow-900/20 border border-yellow-900/40 text-yellow-600/70 hover:border-yellow-600 hover:text-yellow-400"
              : "bg-[#1a1a1a] border border-[#333] text-[#555] hover:border-[#555] hover:text-white"
          }`}
        >
          {busy ? "…" : "✓"}
        </button>
      </div>
    </div>
  );
}

// ─── Exercise Table ────────────────────────────────────────────────────────────
function ExerciseTable({
  exercise, sessionId, logs, prevLogs, extraSets,
  onLogsUpdate, onAddSet, onRestStart, accentColor,
}: {
  exercise: Exercise;
  sessionId: number;
  logs: LogEntry[];
  prevLogs: LogEntry[];
  extraSets: number;
  onLogsUpdate: (updated: LogEntry[]) => void;
  onAddSet: () => void;
  onRestStart: () => void;
  accentColor: string;
}) {
  const defaultWeight = parseWeight(exercise.weight);
  const defaultReps = parseReps(exercise.reps);

  const logsForEx = (sn: number) => logs.find((l) => l.exercise_name === exercise.name && l.set_number === sn);
  const prevForEx = (sn: number) => prevLogs.find((l) => l.exercise_name === exercise.name && l.set_number === sn);

  const totalSets = exercise.sets + extraSets;
  const doneSets = Array.from({ length: totalSets }, (_, i) => i + 1).filter((s) => {
    const log = logsForEx(s);
    return log && Number(log.reps) > 0; // only count completed (not failed) sets
  }).length;
  const warmupDone = !!logsForEx(0);
  const allDone = warmupDone && doneSets === totalSets;

  function handleSaved(entry: LogEntry) {
    onLogsUpdate([
      ...logs.filter((l) => !(l.exercise_name === entry.exercise_name && l.set_number === entry.set_number)),
      entry,
    ]);
  }

  function handleUnsaved(setNum: number) {
    onLogsUpdate(logs.filter((l) => !(l.exercise_name === exercise.name && l.set_number === setNum)));
  }

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all ${
      allDone ? "border-green-900/40" : "border-[#1f1f1f]"
    } bg-[#111]`}>
      {/* Exercise header */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-white text-sm leading-tight">{exercise.name}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: accentColor + "99" }}>
              {exercise.muscle} · {exercise.sets} × {exercise.reps} · {exercise.weight}
            </p>
          </div>
          {allDone && (
            <span className="text-[10px] font-black text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">DONE</span>
          )}
          {!allDone && (
            <span className="text-[10px] font-mono text-[#444]">{doneSets}/{totalSets}</span>
          )}
        </div>
        <p className="text-[10px] text-[#444] italic mt-1.5 leading-relaxed">{exercise.tip}</p>
      </div>

      {/* Table header */}
      <div className="flex items-center px-3 py-1 bg-[#0a0a0a] gap-2">
        <span className="text-[9px] font-black text-[#333] uppercase tracking-widest w-5 text-center shrink-0">SET</span>
        <span className="text-[9px] font-black text-[#333] uppercase tracking-widest w-16 shrink-0">PREV</span>
        <span className="text-[9px] font-black text-[#333] uppercase tracking-widest w-14 text-center shrink-0">REPS</span>
      </div>

      {/* Warmup row */}
      <SetRow
        isWarmup key={`w-${exercise.name}`}
        setNum={0} sessionId={sessionId} exerciseName={exercise.name}
        saved={logsForEx(0)} prevLog={prevForEx(0)}
        defaultWeight={defaultWeight} defaultReps={defaultReps}
        onSaved={handleSaved} onUnsaved={handleUnsaved}
        onRestStart={() => {}} // warmup doesn't trigger rest
      />

      {/* Working sets */}
      {Array.from({ length: totalSets }, (_, i) => i + 1).map((s) => (
        <SetRow
          key={`${exercise.name}-${s}`} isWarmup={false}
          setNum={s} sessionId={sessionId} exerciseName={exercise.name}
          saved={logsForEx(s)} prevLog={prevForEx(s)}
          defaultWeight={defaultWeight} defaultReps={defaultReps}
          onSaved={handleSaved} onUnsaved={handleUnsaved}
          onRestStart={onRestStart}
        />
      ))}

      {/* Add set */}
      <button
        onClick={onAddSet}
        className="w-full py-2.5 text-[11px] font-black text-[#444] hover:text-white transition-colors border-t border-[#1a1a1a] tracking-widest uppercase"
      >
        + Add Set
      </button>
    </div>
  );
}

// ─── Rest Timer Bar ────────────────────────────────────────────────────────────
function RestTimerBar({ seconds, total, onSkip }: { seconds: number; total: number; onSkip: () => void }) {
  const pct = (seconds / total) * 100;
  return (
    <div className="bg-[#141414] border border-[#222] rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black text-[#555] uppercase tracking-widest">Rest</span>
          <span className="text-sm font-black text-white font-mono">{fmt(seconds)}</span>
        </div>
        <div className="h-1 bg-[#222] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: "#C8FF00" }}
          />
        </div>
      </div>
      <button
        onClick={onSkip}
        className="text-[10px] font-black text-[#555] hover:text-white transition-colors uppercase tracking-widest px-2 py-1"
      >
        Skip
      </button>
    </div>
  );
}

// ─── Cancel Confirm ────────────────────────────────────────────────────────────
function CancelConfirm({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 px-4 pb-10">
      <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 w-full max-w-md">
        <p className="text-white font-black text-lg mb-1">Cancel workout?</p>
        <p className="text-[#555] text-sm mb-6">All logged sets will be deleted.</p>
        <div className="flex gap-3">
          <button onClick={onDismiss} className="flex-1 bg-[#1f1f1f] border border-[#2a2a2a] text-white font-bold py-3.5 rounded-xl">
            Keep going
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-950/60 border border-red-900/50 text-red-400 font-black py-3.5 rounded-xl">
            Cancel it
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [prevLogs, setPrevLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(30);
  const [extraSets, setExtraSets] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayDayType = getTodayDayType();

  // ── Workout timer
  useEffect(() => {
    if (!activeSession) { setElapsed(0); return; }
    const start = new Date(activeSession.created_at).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rest countdown
  useEffect(() => {
    if (!restActive) return;
    if (restSeconds <= 0) { setRestActive(false); setRestSeconds(30); return; }
    restRef.current = setTimeout(() => setRestSeconds((s) => s - 1), 1000);
    return () => { if (restRef.current) clearTimeout(restRef.current); };
  }, [restActive, restSeconds]);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [];
    setSessions(arr);
    return arr as Session[];
  }, []);

  async function loadPrevLogs(dayType: DayType, excludeId: number, allSessions: Session[]) {
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
        const todaySess = data.find((s: Session) => s.date === today && !s.completed);
        if (todaySess) {
          setActiveSession(todaySess);
          const logsRes = await fetch(`/api/sessions/${todaySess.id}`);
          setLogs(await logsRes.json());
          await loadPrevLogs(todaySess.day_type, todaySess.id, data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startWorkout() {
    if (!todayDayType) return;
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_type: todayDayType }),
      });
      const session = await res.json();
      setActiveSession(session);
      setLogs([]);
      setExtraSets({});
      const updated = await fetchSessions();
      await loadPrevLogs(session.day_type, session.id, updated);
    } finally {
      setStarting(false);
    }
  }

  async function finishWorkout() {
    if (!activeSession) return;
    await fetch(`/api/sessions/${activeSession.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, duration_seconds: elapsed }),
    });
    await fetchSessions();
    setActiveSession(null);
    setLogs([]);
    setPrevLogs([]);
    setExtraSets({});
    setRestActive(false);
  }

  async function cancelWorkout() {
    if (!activeSession) return;
    await fetch(`/api/sessions/${activeSession.id}`, { method: "DELETE" });
    await fetchSessions();
    setActiveSession(null);
    setLogs([]);
    setPrevLogs([]);
    setExtraSets({});
    setShowCancel(false);
    setRestActive(false);
  }

  function triggerRest() {
    setRestSeconds(30);
    setRestActive(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] text-sm font-bold tracking-widest uppercase animate-pulse">Loading…</p>
      </div>
    );
  }

  // ── REST DAY (Sunday)
  if (!todayDayType && !activeSession) {
    const streak = computeStreak(sessions);
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col pb-28">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-6xl mb-4">😴</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Rest Day</h1>
          <p className="text-[#555] text-sm mt-2 mb-6">Sunday. No weights. Sleep, eat, grow.</p>
          {streak > 0 && (
            <div className="bg-[#141414] border border-[#222] rounded-2xl px-6 py-3 mb-4">
              <p className="text-[#555] text-[10px] uppercase tracking-widest">Current Streak</p>
              <p className="text-3xl font-black text-orange-400">🔥 {streak}</p>
            </div>
          )}
          <div className="text-[#444] text-xs space-y-1 mt-2">
            <p>· Eat enough protein (aim for 100g today)</p>
            <p>· 8h sleep = muscle growth</p>
            <p>· Light walk is fine — just no lifting</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const dayType = activeSession?.day_type ?? todayDayType!;
  const a = ACCENT[dayType];
  const exercises = PROGRAM[dayType];
  const streak = computeStreak(sessions);

  // Volume + sets stats
  const volume = calcVolume(logs);
  const totalWorkSets = exercises.reduce((acc, ex) => acc + ex.sets + (extraSets[ex.name] ?? 0), 0);
  const doneWorkSets = exercises.reduce((acc, ex) => {
    const total = ex.sets + (extraSets[ex.name] ?? 0);
    return acc + Array.from({ length: total }, (_, i) => i + 1).filter(
      (s) => logs.find((l) => l.exercise_name === ex.name && l.set_number === s)
    ).length;
  }, 0);
  const pct = totalWorkSets > 0 ? Math.round((doneWorkSets / totalWorkSets) * 100) : 0;

  // This-week strip
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const completedDates = new Map(sessions.filter((s) => s.completed).map((s) => [s.date, s.day_type]));

  // Week Mon–Sat
  const dow = today.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + diffToMon + i);
    return d;
  });

  const lastCompleted = sessions.find((s) => s.completed);

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {showCancel && <CancelConfirm onConfirm={cancelWorkout} onDismiss={() => setShowCancel(false)} />}

      {/* Accent stripe */}
      <div className="h-0.5" style={{ background: a.color }} />

      {/* ── ACTIVE WORKOUT ── */}
      {activeSession ? (
        <>
          {/* Workout stats bar */}
          <div className="px-4 pt-5 pb-3 border-b border-[#141414]">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: a.color }}>
                  {a.label} DAY · {a.sub}
                </p>
                <span className="text-[10px] text-[#444] font-mono">{pct}%</span>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "TIME", value: fmt(elapsed) },
                  { label: "VOL", value: volume > 0 ? `${volume.toLocaleString()}kg` : "—" },
                  { label: "SETS", value: `${doneWorkSets}/${totalWorkSets}` },
                ].map((s) => (
                  <div key={s.label} className="bg-[#111] rounded-xl p-2.5 text-center">
                    <p className="text-[9px] font-black text-[#444] uppercase tracking-widest">{s.label}</p>
                    <p className="text-sm font-black text-white font-mono mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: pct === 100 ? "#C8FF00" : a.color }}
                />
              </div>
            </div>
          </div>

          {/* Exercise tables */}
          <div className="max-w-md mx-auto px-4 pt-4 pb-52 space-y-3">
            {exercises.map((ex) => (
              <ExerciseTable
                key={ex.name}
                exercise={ex}
                sessionId={activeSession.id}
                logs={logs}
                prevLogs={prevLogs}
                extraSets={extraSets[ex.name] ?? 0}
                onLogsUpdate={setLogs}
                onAddSet={() => setExtraSets((prev) => ({ ...prev, [ex.name]: (prev[ex.name] ?? 0) + 1 }))}
                onRestStart={triggerRest}
                accentColor={a.color}
              />
            ))}
          </div>

          {/* Fixed bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-24 pt-3 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent">
            <div className="max-w-md mx-auto space-y-2">
              {restActive && (
                <RestTimerBar
                  seconds={restSeconds}
                  total={30}
                  onSkip={() => { setRestActive(false); setRestSeconds(30); }}
                />
              )}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowCancel(true)}
                  className="flex-1 bg-[#111] border border-[#222] text-[#555] font-bold py-4 rounded-2xl hover:border-red-900/40 hover:text-red-500 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={finishWorkout}
                  className="flex-[2] font-black py-4 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-wider"
                  style={
                    pct === 100
                      ? { background: "#C8FF00", color: "#000", boxShadow: "0 0 24px rgba(200,255,0,0.4)" }
                      : { background: "#141414", border: "1px solid #222", color: "#fff" }
                  }
                >
                  {pct === 100 ? "FINISH ✓" : `Finish (${pct}%)`}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ── IDLE (no active session) ── */
        <>
          <div className="px-4 pt-10 pb-4 max-w-md mx-auto">
            {/* Greeting */}
            <p className="text-[#444] text-[10px] font-bold uppercase tracking-widest mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">
                  Welcome back,
                </h1>
                <h2 className="text-4xl font-black tracking-tighter leading-none" style={{ color: a.color }}>
                  KAI
                </h2>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 bg-[#141414] border border-[#222] rounded-full px-3 py-1.5 mt-1">
                  <span className="text-sm">🔥</span>
                  <span className="text-white font-black text-sm">{streak}</span>
                  <span className="text-[#555] text-[9px] uppercase font-bold">streak</span>
                </div>
              )}
            </div>

            {/* Coach line */}
            <p className="text-[#555] text-xs italic mt-3">
              &ldquo;{coachLine(sessions, todayDayType, streak)}&rdquo;
            </p>

            {/* This week strip */}
            <div className="mt-4 bg-[#111] border border-[#1a1a1a] rounded-2xl p-3">
              <p className="text-[9px] font-black text-[#444] uppercase tracking-widest mb-2">This week</p>
              <div className="grid grid-cols-6 gap-1.5">
                {weekDays.map((day, i) => {
                  const str = day.toISOString().split("T")[0];
                  const dt = completedDates.get(str);
                  const isToday = str === todayStr;
                  const isPast = day < today && !isToday;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <p className="text-[8px] font-bold text-[#333] uppercase">{["M","T","W","T","F","S"][i]}</p>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center border"
                        style={
                          dt
                            ? { background: ACCENT[dt].color + "22", borderColor: ACCENT[dt].color + "55" }
                            : isToday
                            ? { background: a.color + "15", borderColor: a.color + "40" }
                            : { background: "#0a0a0a", borderColor: "#1a1a1a" }
                        }
                      >
                        {dt
                          ? <span className="text-[10px] font-black" style={{ color: ACCENT[dt].color }}>✓</span>
                          : isToday
                          ? <span className="text-[10px] font-black" style={{ color: a.color }}>·</span>
                          : isPast
                          ? <span className="text-[#222] text-[10px]">—</span>
                          : <span className="text-[#1a1a1a] text-[10px]">·</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "This week", value: weekDays.filter((d) => completedDates.has(d.toISOString().split("T")[0])).length, unit: "sessions" },
                { label: "All time", value: sessions.filter((s) => s.completed).length, unit: "sessions" },
                { label: "Last session", value: lastCompleted?.duration_seconds ? fmtDuration(lastCompleted.duration_seconds) : "—", unit: lastCompleted?.duration_seconds ? "" : "" },
              ].map((s) => (
                <div key={s.label} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-2.5 text-center">
                  <p className="text-[9px] font-black text-[#444] uppercase tracking-widest">{s.label}</p>
                  <p className="font-black text-white text-sm mt-0.5 font-mono">{s.value}</p>
                  {s.unit && <p className="text-[8px] text-[#333] uppercase">{s.unit}</p>}
                </div>
              ))}
            </div>

            {/* Today's workout preview */}
            <div className="mt-4 bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <p className="text-[9px] font-black text-[#444] uppercase tracking-widest">Today</p>
                <p className="font-black text-lg text-white uppercase tracking-tight mt-0.5">
                  {a.label} <span className="font-normal text-[#555] text-sm normal-case tracking-normal">·  {a.sub}</span>
                </p>
              </div>
              {exercises.map((ex, i) => (
                <div key={ex.name} className={`flex items-center justify-between px-4 py-2.5 ${i < exercises.length - 1 ? "border-b border-[#111]" : ""}`} style={{ background: "#0d0d0d" }}>
                  <div>
                    <p className="text-sm font-semibold text-[#888]">{ex.name}</p>
                    <p className="text-[10px] text-[#444]">{ex.sets} sets · {ex.reps} reps</p>
                  </div>
                  <p className="text-[10px] text-[#333] font-mono">{ex.weight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed START button */}
          <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-24 pt-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent">
            <div className="max-w-md mx-auto">
              <button
                onClick={startWorkout}
                disabled={starting}
                className="w-full font-black text-base py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 text-black"
                style={{ background: "#C8FF00", boxShadow: "0 0 32px rgba(200,255,0,0.25)" }}
              >
                {starting ? "LOADING…" : `START ${a.label}`}
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
