"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  PROGRAM, DayType, Intensity, ACCENT,
  getTodayDayType, Exercise, getSetCount,
  localDateStr, getMissedDays, getAdaptation,
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

// ─── Utils ────────────────────────────────────────────────────────────────────
function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

function parseWeight(w: string): number {
  const m = w.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function parseReps(r: string): number {
  const m = r.match(/(\d+)/);
  return m ? parseInt(m[1]) : 10;
}

function computeStreak(sessions: Session[]): number {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (!dates.size) return 0;
  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now() - 86400000));
  if (!dates.has(today) && !dates.has(yesterday)) return 0;
  let streak = 0;
  const d = new Date();
  if (!dates.has(today)) d.setDate(d.getDate() - 1);
  while (dates.has(localDateStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────
function ExerciseRow({
  exercise, totalSets, sessionId, logs, onLogsUpdate, onRestStart,
}: {
  exercise: Exercise;
  totalSets: number;
  sessionId: number;
  logs: LogEntry[];
  onLogsUpdate: (l: LogEntry[]) => void;
  onRestStart: () => void;
}) {
  const [pending, setPending] = useState<Set<number>>(new Set());
  const dw = parseWeight(exercise.weight);
  const dr = parseReps(exercise.reps);

  function isSaved(sn: number) {
    return logs.some((l) => l.exercise_name === exercise.name && l.set_number === sn);
  }

  const doneSets = Array.from({ length: totalSets }, (_, i) => i + 1).filter(isSaved).length;
  const warmupDone = isSaved(0);
  const allDone = warmupDone && doneSets === totalSets;

  async function tap(setNum: number) {
    if (pending.has(setNum)) return;
    const saved = isSaved(setNum);

    // Optimistic
    if (saved) {
      onLogsUpdate(logs.filter((l) => !(l.exercise_name === exercise.name && l.set_number === setNum)));
    } else {
      onLogsUpdate([...logs, { exercise_name: exercise.name, set_number: setNum, reps: dr, weight_kg: dw }]);
      if (setNum > 0) onRestStart();
    }

    setPending((p) => new Set(p).add(setNum));
    if (saved) {
      await fetch("/api/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, exercise_name: exercise.name, set_number: setNum }),
      });
    } else {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, exercise_name: exercise.name, set_number: setNum, reps: dr, weight_kg: dw }),
      });
    }
    setPending((p) => { const s = new Set(p); s.delete(setNum); return s; });
  }

  return (
    <div className={`py-5 border-b border-[#111] last:border-0 transition-opacity ${allDone ? "opacity-50" : ""}`}>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2.5">
          <p className="text-white font-medium">{exercise.name}</p>
          <p className="text-[#444] text-xs">{exercise.muscle}</p>
        </div>
        <p className="text-[#333] text-sm tabular-nums">{doneSets}/{totalSets}</p>
      </div>
      <div className="flex gap-2.5 items-center flex-wrap">
        {/* Warmup dot */}
        <button
          onClick={() => tap(0)}
          disabled={pending.has(0)}
          className={`w-5 h-5 rounded-full transition-all disabled:opacity-40 ${
            warmupDone ? "bg-[#ca8a04]" : "border border-[#ca8a04]/30 hover:border-[#ca8a04]/70"
          }`}
          title="Warmup set"
        />
        <div className="w-px h-4 bg-[#222]" />
        {/* Working sets */}
        {Array.from({ length: totalSets }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            onClick={() => tap(s)}
            disabled={pending.has(s)}
            className={`w-7 h-7 rounded-full transition-all disabled:opacity-40 ${
              isSaved(s) ? "bg-white" : "border border-[#2a2a2a] hover:border-[#555]"
            }`}
          />
        ))}
      </div>
      {!allDone && (
        <p className="text-[#333] text-xs italic mt-2.5 leading-relaxed">{exercise.tip}</p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [extraSets, setExtraSets] = useState(0);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dayType = getTodayDayType();
  const a = ACCENT[dayType];
  const exercises = PROGRAM[dayType];

  // Load intensity from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("intensity") as Intensity | null;
    if (saved && ["easy", "medium", "hard"].includes(saved)) setIntensity(saved);
  }, []);

  function setIntensitySaved(v: Intensity) {
    setIntensity(v);
    localStorage.setItem("intensity", v);
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
    if (restSeconds <= 0) return;
    restRef.current = setTimeout(() => setRestSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => { if (restRef.current) clearTimeout(restRef.current); };
  }, [restSeconds]);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [];
    setSessions(arr);
    return arr as Session[];
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/init", { method: "POST" });
        const data = await fetchSessions();
        const today = localDateStr();
        const todaySess = data.find((s: Session) => s.date === today && !s.completed);
        if (todaySess) {
          setActiveSession(todaySess);
          const r = await fetch(`/api/sessions/${todaySess.id}`);
          setLogs(await r.json());
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
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_type: dayType }),
      });
      const session = await res.json();
      setActiveSession(session);
      setLogs([]);
    } finally {
      setStarting(false);
    }
    fetchSessions();
  }

  async function finishWorkout() {
    if (!activeSession) return;
    await fetch(`/api/sessions/${activeSession.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, duration_seconds: elapsed }),
    });
    setActiveSession(null);
    setLogs([]);
    setRestSeconds(0);
    setShowConfirmFinish(false);
    fetchSessions();
  }

  async function cancelWorkout() {
    if (!activeSession) return;
    await fetch(`/api/sessions/${activeSession.id}`, { method: "DELETE" });
    setActiveSession(null);
    setLogs([]);
    setRestSeconds(0);
    fetchSessions();
  }

  function triggerRest() {
    setRestSeconds(30);
  }

  // Stats for active workout
  const totalWorkSets = exercises.reduce((acc, ex) => acc + getSetCount(ex.sets, intensity) + extraSets, 0);
  const doneWorkSets = exercises.reduce((acc, ex) => {
    const total = getSetCount(ex.sets, intensity) + extraSets;
    return acc + Array.from({ length: total }, (_, i) => i + 1).filter((s) =>
      logs.some((l) => l.exercise_name === ex.name && l.set_number === s)
    ).length;
  }, 0);
  const pct = totalWorkSets > 0 ? Math.round((doneWorkSets / totalWorkSets) * 100) : 0;

  // Idle screen stats
  const streak = computeStreak(sessions);
  const today = localDateStr();
  const dow = new Date().getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - daysFromMon + i);
    return localDateStr(d);
  });
  const completedDates = new Map(sessions.filter((s) => s.completed).map((s) => [s.date, s.day_type]));
  const thisWeekCount = weekDays.filter((d) => completedDates.has(d)).length;
  const missed = getMissedDays(sessions);
  const adaptation = getAdaptation(missed);

  // Apply adaptation extra sets
  useEffect(() => {
    setExtraSets(adaptation.extraSets);
  }, [adaptation.extraSets]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#333] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">

      {/* ── ACTIVE WORKOUT ── */}
      {activeSession ? (
        <>
          {/* Header */}
          <div className="px-5 pt-14 pb-5 border-b border-[#111]">
            <div className="max-w-md mx-auto flex items-baseline justify-between">
              <div>
                <p className="text-4xl font-bold tabular-nums text-white">{fmt(elapsed)}</p>
                <p className="text-[#444] text-sm mt-0.5">{a.label} · {intensity}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium tabular-nums">{doneWorkSets}/{totalWorkSets}</p>
                <p className="text-[#444] text-xs mt-0.5">sets</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="max-w-md mx-auto mt-4">
              <div className="h-px bg-[#111] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: pct === 100 ? "#fff" : a.color }}
                />
              </div>
            </div>
          </div>

          {/* Rest timer */}
          {restSeconds > 0 && (
            <div className="max-w-md mx-auto px-5 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#111] overflow-hidden">
                  <div
                    className="h-full bg-[#333] transition-all duration-1000"
                    style={{ width: `${(restSeconds / 30) * 100}%` }}
                  />
                </div>
                <p className="text-[#555] text-sm tabular-nums">{fmt(restSeconds)}</p>
                <button
                  onClick={() => setRestSeconds(0)}
                  className="text-[#444] text-xs hover:text-white transition-colors"
                >
                  skip
                </button>
              </div>
            </div>
          )}

          {/* Exercise list */}
          <div className="max-w-md mx-auto px-5 pb-40">
            {exercises.map((ex) => (
              <ExerciseRow
                key={ex.name}
                exercise={ex}
                totalSets={getSetCount(ex.sets, intensity) + extraSets}
                sessionId={activeSession.id}
                logs={logs}
                onLogsUpdate={setLogs}
                onRestStart={triggerRest}
              />
            ))}

            {/* Add extra set to all */}
            <button
              onClick={() => setExtraSets((e) => e + 1)}
              className="mt-4 text-[#333] text-xs hover:text-[#666] transition-colors uppercase tracking-wider"
            >
              + Add set to all
            </button>
          </div>

          {/* Bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#111] px-5 pb-6 pt-4 z-30">
            <div className="max-w-md mx-auto flex gap-3">
              <button
                onClick={cancelWorkout}
                className="px-5 py-4 text-[#444] text-sm hover:text-[#777] transition-colors"
              >
                Cancel
              </button>
              {showConfirmFinish ? (
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => setShowConfirmFinish(false)}
                    className="flex-1 py-4 border border-[#222] rounded-2xl text-[#666] text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={finishWorkout}
                    className="flex-1 py-4 rounded-2xl text-black text-sm font-semibold"
                    style={{ background: a.color }}
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => pct === 100 ? finishWorkout() : setShowConfirmFinish(true)}
                  className="flex-1 py-4 rounded-2xl text-sm font-semibold transition-all"
                  style={
                    pct === 100
                      ? { background: "#fff", color: "#000" }
                      : { background: "#111", color: "#666", border: "1px solid #1a1a1a" }
                  }
                >
                  {pct === 100 ? "Finish ✓" : `Finish (${pct}%)`}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── IDLE ── */
        <>
          <div className="max-w-md mx-auto px-5 pt-14 pb-36">
            {/* Header */}
            <p className="text-[#444] text-sm mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-5xl font-bold tracking-tight" style={{ color: a.color }}>{a.label}</h1>
              {streak > 0 && (
                <div className="mt-2 text-right">
                  <p className="text-white font-bold text-2xl">{streak}</p>
                  <p className="text-[#444] text-xs">streak</p>
                </div>
              )}
            </div>
            <p className="text-[#444] text-sm mb-8">{a.sub}</p>

            {/* Adaptation message */}
            {adaptation.message && (
              <div className="mb-6 flex items-start gap-2">
                <span className="text-[#e09a20] text-xs mt-0.5">↑</span>
                <p className="text-[#888] text-sm">{adaptation.message}</p>
              </div>
            )}

            {/* Week strip */}
            <div className="flex gap-1 mb-8">
              {weekDays.map((d, i) => {
                const dt = completedDates.get(d);
                const isToday = d === today;
                const isFuture = new Date(d + "T12:00:00") > new Date();
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <p className="text-[10px] text-[#333]">{["M","T","W","T","F","S","S"][i]}</p>
                    <div
                      className="w-full h-0.5 rounded-full"
                      style={{
                        background: dt
                          ? ACCENT[dt].color
                          : isToday
                          ? a.color + "50"
                          : isFuture
                          ? "#111"
                          : "#1a1a1a",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Quick stats */}
            <div className="flex gap-6 mb-8">
              <div>
                <p className="text-[#444] text-xs">This week</p>
                <p className="text-white font-semibold mt-0.5">{thisWeekCount} / 7</p>
              </div>
              <div>
                <p className="text-[#444] text-xs">All time</p>
                <p className="text-white font-semibold mt-0.5">{sessions.filter((s) => s.completed).length}</p>
              </div>
              {sessions.find((s) => s.completed)?.duration_seconds && (
                <div>
                  <p className="text-[#444] text-xs">Last session</p>
                  <p className="text-white font-semibold mt-0.5">{fmtDur(sessions.find((s) => s.completed)!.duration_seconds!)}</p>
                </div>
              )}
            </div>

            {/* Today's exercises */}
            <p className="text-[#333] text-xs uppercase tracking-widest mb-4">Today</p>
            <div className="mb-8">
              {exercises.map((ex, i) => (
                <div key={ex.name} className={`flex justify-between py-3 ${i < exercises.length - 1 ? "border-b border-[#0d0d0d]" : ""}`}>
                  <p className="text-white text-sm">{ex.name}</p>
                  <p className="text-[#444] text-sm tabular-nums">
                    {getSetCount(ex.sets, intensity) + adaptation.extraSets} × {ex.reps}
                  </p>
                </div>
              ))}
            </div>

            {/* Intensity */}
            <p className="text-[#333] text-xs uppercase tracking-widest mb-3">Intensity</p>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as Intensity[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setIntensitySaved(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${
                    intensity === m
                      ? "bg-white text-black font-semibold"
                      : "text-[#444] border border-[#1a1a1a] hover:text-[#777]"
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#111] px-5 pb-6 pt-4 z-30">
            <div className="max-w-md mx-auto">
              <button
                onClick={startWorkout}
                disabled={starting}
                className="w-full py-4 rounded-2xl text-black text-base font-semibold disabled:opacity-50 transition-opacity"
                style={{ background: a.color }}
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
