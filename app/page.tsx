"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  PROGRAM, DayType, Intensity, ACCENT, WEEKLY_SCHEDULE, DAY_NAMES,
  getTodayDayType, Exercise, getSetCount,
} from "@/lib/program";
import { BottomNav } from "@/components/BottomNav";

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
  set_number: number;
  reps: number | string;
  weight_kg: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

function calcVolume(logs: LogEntry[]) {
  return logs
    .filter((l) => l.set_number > 0 && Number(l.reps) > 0)
    .reduce((acc, l) => acc + Number(l.reps) * Number(l.weight_kg), 0);
}

function parseWeight(w: string): number {
  const m = w.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function parseReps(r: string): number {
  const m = r.match(/(\d+)/);
  return m ? parseInt(m[1]) : 10;
}

function computeStreak(sessions: Session[]) {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (!dates.size) return 0;
  const today = new Date(); today.setHours(12, 0, 0, 0);
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
  if (!last) return "Day one. Let's build something real.";
  const diff = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  if (diff === 0) return "Session locked in. Protein up. Recover.";
  if (streak >= 5) return `${streak}-day streak. You're in the zone.`;
  if (streak >= 3) return `${streak} days straight. Body's adapting.`;
  if (diff === 1) return "24h rest done. You're ready.";
  if (diff === 2) return "2 days off — muscles rebuilt. Hit it.";
  return `${diff} days since last session. Don't lose it.`;
}

// ─── Set Row ──────────────────────────────────────────────────────────────────
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
  const prevLabel = prevLog && Number(prevLog.reps) > 0 ? `${prevLog.reps}×${prevLog.weight_kg}kg` : "—";

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

  if (isDone && !editing) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer active:opacity-60"
        onClick={() => !busy && setEditing(true)}
      >
        <span className="text-xs font-semibold text-[#22c55e] w-5 text-center shrink-0">{label}</span>
        <span className="flex-1 text-sm text-[#22c55e]">{saved!.reps} reps <span className="text-[#22c55e]/50 text-xs">· {defaultWeight}kg</span></span>
        <button onClick={(e) => { e.stopPropagation(); undoEntry(); }} disabled={busy}
          className="text-xs text-[#444] hover:text-[#888] transition-colors px-1">
          undo
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111]">
        <span className="text-xs font-semibold text-[#22c55e] w-5 text-center shrink-0">{label}</span>
        <span className="text-xs text-[#555] shrink-0">{defaultWeight}kg</span>
        <input
          type="number" value={editReps} onChange={(e) => setEditReps(e.target.value)} autoFocus
          className="w-16 text-sm font-semibold text-center rounded-lg px-2 py-1.5 bg-[#1c1c1c] border border-[#2e2e2e] text-white focus:outline-none focus:border-[#444]"
        />
        <span className="text-xs text-[#555] shrink-0">reps</span>
        <div className="ml-auto flex gap-2">
          <button onClick={confirmEdit} disabled={busy}
            className="text-xs font-semibold text-[#22c55e] px-3 py-1.5 bg-[#22c55e]/10 rounded-lg disabled:opacity-40">
            {busy ? "…" : "Save"}
          </button>
          <button onClick={() => { setEditing(false); setEditReps(String(saved?.reps ?? defaultReps)); }}
            className="text-xs text-[#555] hover:text-white px-1">✕</button>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-semibold text-[#ef4444]/50 w-5 text-center shrink-0">{label}</span>
        <span className="flex-1 text-sm text-[#ef4444]/50">Too hard</span>
        <button onClick={undoEntry} disabled={busy}
          className="text-xs text-[#444] hover:text-[#888] transition-colors px-1">
          undo
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className={`text-xs font-semibold w-5 text-center shrink-0 ${isWarmup ? "text-[#ca8a04]" : "text-[#555]"}`}>
        {label}
      </span>
      <span className="text-xs text-[#333] font-mono w-20 shrink-0">{prevLabel}</span>
      <input
        type="number" value={editReps} onChange={(e) => setEditReps(e.target.value)}
        className="w-16 text-sm font-semibold text-center rounded-lg px-1 py-1.5 bg-[#1c1c1c] border border-[#2a2a2a] text-white focus:outline-none focus:border-[#3a3a3a]"
      />
      <span className="text-xs text-[#444] shrink-0">reps</span>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => saveEntry(0)} disabled={busy} title="Too hard"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#ef4444]/40 hover:text-[#ef4444]/80 hover:bg-[#ef4444]/10 transition-all text-sm disabled:opacity-30">
          ✗
        </button>
        <button onClick={() => saveEntry(Math.max(1, parseInt(editReps) || 1))} disabled={busy}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm disabled:opacity-30 ${
            isWarmup
              ? "text-[#ca8a04]/60 hover:text-[#ca8a04] hover:bg-[#ca8a04]/10"
              : "text-[#555] hover:text-white hover:bg-[#1e1e1e]"
          }`}>
          {busy ? "…" : "✓"}
        </button>
      </div>
    </div>
  );
}

// ─── Exercise Table ────────────────────────────────────────────────────────────
function ExerciseTable({
  exercise, sessionId, logs, prevLogs, extraSets, intensity,
  onLogsUpdate, onAddSet, onRestStart, accentColor,
}: {
  exercise: Exercise;
  sessionId: number;
  logs: LogEntry[];
  prevLogs: LogEntry[];
  extraSets: number;
  intensity: Intensity;
  onLogsUpdate: (updated: LogEntry[]) => void;
  onAddSet: () => void;
  onRestStart: () => void;
  accentColor: string;
}) {
  const defaultWeight = parseWeight(exercise.weight);
  const defaultReps = parseReps(exercise.reps);
  const totalSets = getSetCount(exercise.sets, intensity) + extraSets;

  const logsForEx = (sn: number) => logs.find((l) => l.exercise_name === exercise.name && l.set_number === sn);
  const prevForEx = (sn: number) => prevLogs.find((l) => l.exercise_name === exercise.name && l.set_number === sn);

  const doneSets = Array.from({ length: totalSets }, (_, i) => i + 1).filter((s) => {
    const log = logsForEx(s);
    return log && Number(log.reps) > 0;
  }).length;
  const warmupDone = !!logsForEx(0);
  const allDone = warmupDone && doneSets === totalSets;

  // Progressive overload hint: all sets done and reps match/beat previous
  const showOverloadHint = allDone && doneSets > 0 && Array.from({ length: doneSets }, (_, i) => i + 1).every((s) => {
    const log = logsForEx(s);
    const prev = prevForEx(s);
    return log && prev && Number(log.reps) >= Number(prev.reps);
  });

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
    <div className={`rounded-2xl overflow-hidden border transition-colors ${
      allDone ? "border-[#22c55e]/20 bg-[#080f08]" : "border-[#1e1e1e] bg-[#111]"
    }`}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-white font-semibold text-base leading-tight">{exercise.name}</p>
            <p className="text-[#555] text-xs mt-0.5">{exercise.muscle} · {totalSets}×{exercise.reps} · {exercise.weight}</p>
          </div>
          <span className={`text-xs font-semibold shrink-0 mt-0.5 ${allDone ? "text-[#22c55e]" : "text-[#444]"}`}>
            {allDone ? "Done" : `${doneSets}/${totalSets}`}
          </span>
        </div>
        {showOverloadHint && (
          <p className="text-xs text-amber-400 mt-2.5 flex items-center gap-1.5">
            <span>↑</span> Increase weight next session
          </p>
        )}
        <p className="text-[#444] text-xs italic mt-2 leading-relaxed">{exercise.tip}</p>
      </div>

      <div className="border-t border-[#1a1a1a]">
        <div className="flex items-center px-4 py-2 bg-[#0d0d0d]">
          <span className="text-[9px] font-bold text-[#2e2e2e] uppercase tracking-widest w-5 shrink-0">SET</span>
          <span className="text-[9px] font-bold text-[#2e2e2e] uppercase tracking-widest w-20 shrink-0 ml-3">PREV</span>
          <span className="text-[9px] font-bold text-[#2e2e2e] uppercase tracking-widest w-16 text-center shrink-0">REPS</span>
        </div>

        <SetRow
          isWarmup key={`w-${exercise.name}`}
          setNum={0} sessionId={sessionId} exerciseName={exercise.name}
          saved={logsForEx(0)} prevLog={prevForEx(0)}
          defaultWeight={defaultWeight} defaultReps={defaultReps}
          onSaved={handleSaved} onUnsaved={handleUnsaved}
          onRestStart={() => {}}
        />

        {Array.from({ length: totalSets }, (_, i) => i + 1).map((s) => (
          <div key={s} className="border-t border-[#161616]">
            <SetRow
              isWarmup={false}
              setNum={s} sessionId={sessionId} exerciseName={exercise.name}
              saved={logsForEx(s)} prevLog={prevForEx(s)}
              defaultWeight={defaultWeight} defaultReps={defaultReps}
              onSaved={handleSaved} onUnsaved={handleUnsaved}
              onRestStart={onRestStart}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onAddSet}
        className="w-full py-3 text-xs font-semibold text-[#333] hover:text-[#666] transition-colors border-t border-[#1a1a1a] tracking-widest uppercase"
      >
        + Add Set
      </button>
    </div>
  );
}

// ─── Rest Timer ────────────────────────────────────────────────────────────────
function RestTimerBar({ seconds, total, onSkip }: { seconds: number; total: number; onSkip: () => void }) {
  const pct = (seconds / total) * 100;
  return (
    <div className="flex items-center gap-4 bg-[#111] border border-[#1e1e1e] rounded-2xl px-4 py-3">
      <div className="flex-1">
        <div className="h-0.5 bg-[#1e1e1e] rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="font-mono text-white text-sm font-semibold tabular-nums">{fmt(seconds)}</span>
      <button onClick={onSkip} className="text-[#555] text-xs font-semibold hover:text-white transition-colors uppercase tracking-wider">
        Skip
      </button>
    </div>
  );
}

// ─── Cancel Confirm ────────────────────────────────────────────────────────────
function CancelConfirm({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-10">
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-md">
        <p className="text-white font-semibold text-lg mb-1">Cancel workout?</p>
        <p className="text-[#555] text-sm mb-6">All logged sets will be deleted.</p>
        <div className="flex gap-3">
          <button onClick={onDismiss}
            className="flex-1 bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl text-sm">
            Keep going
          </button>
          <button onClick={onConfirm}
            className="flex-1 text-[#ef4444] font-semibold py-3.5 rounded-xl text-sm border border-[#ef4444]/20 hover:bg-[#ef4444]/10 transition-colors">
            End session
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
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayDayType = getTodayDayType();

  // Load intensity from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("workout_intensity") as Intensity | null;
    if (saved && ["easy", "medium", "hard"].includes(saved)) setIntensity(saved);
  }, []);

  function setIntensityAndSave(v: Intensity) {
    setIntensity(v);
    localStorage.setItem("workout_intensity", v);
  }

  // Workout timer
  useEffect(() => {
    if (!activeSession) { setElapsed(0); return; }
    const start = new Date(activeSession.created_at).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rest countdown
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
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-[#333] text-sm">Loading…</p>
      </div>
    );
  }

  // ── REST DAY
  if (!todayDayType && !activeSession) {
    const streak = computeStreak(sessions);
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col pb-28">
        <div className="flex-1 flex flex-col justify-center px-6 pt-20">
          <p className="text-[#444] text-sm mb-1">Sunday</p>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">Rest day.</h1>
          <p className="text-[#555] text-base">Sleep, eat, grow. See you Monday.</p>
          {streak > 0 && (
            <div className="mt-8 inline-flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="text-white font-semibold">{streak}-day streak</span>
            </div>
          )}
          <div className="mt-8 space-y-2 text-[#444] text-sm">
            <p>· Protein up — aim for 100g today</p>
            <p>· 8h sleep = muscle growth</p>
            <p>· Light walk is fine</p>
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
  const volume = calcVolume(logs);

  const totalWorkSets = exercises.reduce((acc, ex) => acc + getSetCount(ex.sets, intensity) + (extraSets[ex.name] ?? 0), 0);
  const doneWorkSets = exercises.reduce((acc, ex) => {
    const total = getSetCount(ex.sets, intensity) + (extraSets[ex.name] ?? 0);
    return acc + Array.from({ length: total }, (_, i) => i + 1).filter((s) => {
      const log = logs.find((l) => l.exercise_name === ex.name && l.set_number === s);
      return log && Number(log.reps) > 0;
    }).length;
  }, 0);
  const pct = totalWorkSets > 0 ? Math.round((doneWorkSets / totalWorkSets) * 100) : 0;

  const today = new Date(); today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const completedDates = new Map(sessions.filter((s) => s.completed).map((s) => [s.date, s.day_type]));
  const dow = today.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + diffToMon + i);
    return d;
  });
  const lastCompleted = sessions.find((s) => s.completed);

  return (
    <div className="min-h-screen bg-[#080808]">
      {showCancel && <CancelConfirm onConfirm={cancelWorkout} onDismiss={() => setShowCancel(false)} />}

      {activeSession ? (
        /* ── ACTIVE WORKOUT ── */
        <>
          {/* Top bar */}
          <div className="px-5 pt-12 pb-4 border-b border-[#141414]">
            <div className="max-w-md mx-auto">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-mono text-white text-3xl font-bold tabular-nums">{fmt(elapsed)}</span>
                <div className="flex items-center gap-4 text-sm text-[#555]">
                  {volume > 0 && <span>{volume.toLocaleString()}kg</span>}
                  <span>{doneWorkSets}/{totalWorkSets} sets</span>
                </div>
              </div>
              <div className="h-px bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : a.color }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[#333] text-xs">{a.label} · {intensity}</p>
                <p className="text-[#333] text-xs">{pct}%</p>
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
                intensity={intensity}
                onLogsUpdate={setLogs}
                onAddSet={() => setExtraSets((prev) => ({ ...prev, [ex.name]: (prev[ex.name] ?? 0) + 1 }))}
                onRestStart={triggerRest}
                accentColor={a.color}
              />
            ))}
          </div>

          {/* Fixed bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-3 bg-[#080808] border-t border-[#141414]">
            <div className="max-w-md mx-auto space-y-2.5">
              {restActive && (
                <RestTimerBar
                  seconds={restSeconds} total={30}
                  onSkip={() => { setRestActive(false); setRestSeconds(30); }}
                />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancel(true)}
                  className="px-5 bg-[#111] text-[#555] font-semibold py-4 rounded-2xl text-sm hover:text-[#888] transition-colors border border-[#1e1e1e]"
                >
                  Cancel
                </button>
                <button
                  onClick={finishWorkout}
                  className="flex-1 font-semibold py-4 rounded-2xl text-sm transition-all"
                  style={
                    pct === 100
                      ? { background: "#22c55e", color: "#000" }
                      : { background: "#161616", color: "#888", border: "1px solid #1e1e1e" }
                  }
                >
                  {pct === 100 ? "Finish workout ✓" : `Finish (${pct}%)`}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ── IDLE ── */
        <>
          <div className="max-w-md mx-auto px-5 pt-14 pb-40">
            {/* Header */}
            <p className="text-[#444] text-sm mb-2">
              {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-5xl font-bold text-white tracking-tight" style={{ color: a.color }}>
                {a.label}
              </h1>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span>🔥</span>
                  <span className="text-white font-semibold text-sm">{streak}</span>
                </div>
              )}
            </div>
            <p className="text-[#555] text-sm mb-1">{a.sub}</p>
            <p className="text-[#444] text-sm italic mb-8">{coachLine(sessions, todayDayType, streak)}</p>

            {/* Week strip */}
            <div className="flex items-center gap-1.5 mb-8">
              {weekDays.map((day, i) => {
                const str = day.toISOString().split("T")[0];
                const dt = completedDates.get(str);
                const isToday = str === todayStr;
                const isPast = day < today && !isToday;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <p className="text-[10px] font-medium text-[#333]">{["M","T","W","T","F","S"][i]}</p>
                    <div
                      className="w-full h-1 rounded-full"
                      style={{
                        background: dt
                          ? ACCENT[dt].color
                          : isToday
                          ? a.color + "40"
                          : isPast
                          ? "#1a1a1a"
                          : "#111",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mb-8 text-sm">
              {[
                { label: "This week", value: weekDays.filter((d) => completedDates.has(d.toISOString().split("T")[0])).length + " sessions" },
                { label: "All time", value: sessions.filter((s) => s.completed).length + " sessions" },
                { label: "Last session", value: lastCompleted?.duration_seconds ? fmtDuration(lastCompleted.duration_seconds) : "—" },
              ].map((s) => (
                <div key={s.label} className="flex-1">
                  <p className="text-[#333] text-xs">{s.label}</p>
                  <p className="text-white font-semibold mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Today's program */}
            <div className="mb-8">
              <p className="text-[#444] text-xs uppercase tracking-widest font-medium mb-3">Today's workout</p>
              <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden">
                {exercises.map((ex, i) => (
                  <div
                    key={ex.name}
                    className={`flex items-center justify-between px-4 py-3.5 ${
                      i < exercises.length - 1 ? "border-b border-[#161616]" : ""
                    }`}
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{ex.name}</p>
                      <p className="text-[#444] text-xs mt-0.5">{ex.muscle}</p>
                    </div>
                    <p className="text-[#555] text-sm font-mono">{getSetCount(ex.sets, intensity)}×{ex.reps}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Intensity selector */}
            <div className="mb-2">
              <p className="text-[#444] text-xs uppercase tracking-widest font-medium mb-3">Intensity</p>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as Intensity[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setIntensityAndSave(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      intensity === m
                        ? "bg-white text-black"
                        : "bg-[#111] text-[#555] border border-[#1e1e1e] hover:text-[#888]"
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* START button */}
          <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-[#080808] border-t border-[#141414] z-30">
            <div className="max-w-md mx-auto">
              <button
                onClick={startWorkout}
                disabled={starting}
                className="w-full py-4 rounded-2xl text-base font-semibold transition-all disabled:opacity-50"
                style={{ background: a.color, color: "#000" }}
              >
                {starting ? "Starting…" : `Start ${a.label}`}
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
