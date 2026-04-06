"use client";

import { useEffect, useState, useCallback } from "react";
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

const COLOR = {
  push: { bg: "bg-orange-500", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", badge: "bg-orange-100 text-orange-700" },
  pull: { bg: "bg-blue-500", light: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
  legs: { bg: "bg-green-500", light: "bg-green-50", border: "border-green-200", text: "text-green-600", badge: "bg-green-100 text-green-700" },
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
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors ${done ? "bg-green-50" : "bg-gray-50"}`}>
      <span className="w-6 text-xs font-bold text-gray-400">S{setNum}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          placeholder="reps"
          value={reps}
          onChange={(e) => { setReps(e.target.value); setDone(false); }}
          className="w-16 text-sm border border-gray-200 rounded px-2 py-1 text-center focus:outline-none focus:border-gray-400"
        />
        <span className="text-xs text-gray-400">×</span>
        <input
          type="number"
          placeholder="kg"
          step="0.5"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setDone(false); }}
          className="w-16 text-sm border border-gray-200 rounded px-2 py-1 text-center focus:outline-none focus:border-gray-400"
        />
        <span className="text-xs text-gray-400">kg</span>
      </div>
      <button
        onClick={save}
        disabled={saving || !reps || !weight}
        className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full transition-all ${
          done
            ? "bg-green-100 text-green-700"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-40"
        }`}
      >
        {saving ? "..." : done ? "✓" : "Save"}
      </button>
    </div>
  );
}

function ExerciseCard({
  sessionId,
  exercise,
  logs,
  onLogsUpdate,
}: {
  sessionId: number;
  exercise: Exercise;
  logs: LogEntry[];
  onLogsUpdate: (updated: LogEntry[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const savedForExercise = (setNum: number) =>
    logs.find((l) => l.exercise_name === exercise.name && l.set_number === setNum);

  const doneCount = Array.from({ length: exercise.sets }, (_, i) => i + 1).filter(
    (s) => savedForExercise(s)
  ).length;

  function handleSave(entry: LogEntry) {
    const updated = [
      ...logs.filter((l) => !(l.exercise_name === entry.exercise_name && l.set_number === entry.set_number)),
      entry,
    ];
    onLogsUpdate(updated);
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <p className="font-semibold text-gray-800 text-sm">{exercise.name}</p>
          <p className="text-xs text-gray-400">{exercise.sets} sets · {exercise.reps} reps · {exercise.weight}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doneCount === exercise.sets ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {doneCount}/{exercise.sets}
          </span>
          <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 bg-white border-t border-gray-100">
          <p className="text-xs text-gray-500 italic mb-2 pt-2">{exercise.tip}</p>
          <div className="flex flex-col gap-1">
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

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [inited, setInited] = useState(false);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(data);
    return data as Session[];
  }, []);

  useEffect(() => {
    async function init() {
      await fetch("/api/init", { method: "POST" });
      setInited(true);
      const data = await fetchSessions();
      const today = new Date().toISOString().split("T")[0];
      const todaySession = data.find((s: Session) => s.date === today && !s.completed);
      if (todaySession) {
        setActiveSession(todaySession);
        const logsRes = await fetch(`/api/sessions/${todaySession.id}`);
        setLogs(await logsRes.json());
      }
      setLoading(false);
    }
    init();
  }, [fetchSessions]);

  async function startWorkout() {
    setStarting(true);
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
    setStarting(false);
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  const lastCompleted = sessions.find((s) => s.completed);
  const nextDay = getNextDayType(lastCompleted?.day_type as DayType | null);
  const dayType = activeSession?.day_type ?? nextDay;
  const currentProgram = PROGRAM[dayType];
  const c = COLOR[dayType];

  const totalSets = currentProgram.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = currentProgram.exercises.reduce((acc, e) => {
    return acc + Array.from({ length: e.sets }, (_, i) => i + 1).filter(
      (s) => logs.find((l) => l.exercise_name === e.name && l.set_number === s)
    ).length;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${c.bg} text-white px-4 pt-12 pb-6`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/70 text-sm font-medium">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
            <a href="/history" className="text-white/70 text-sm hover:text-white transition-colors">
              History →
            </a>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            {currentProgram.label} DAY
          </h1>
          {activeSession && (
            <p className="text-white/80 text-sm mt-1">{doneSets} / {totalSets} sets done</p>
          )}
          {!activeSession && lastCompleted && (
            <p className="text-white/70 text-sm mt-1">
              Last: {PROGRAM[lastCompleted.day_type as DayType].label} on{" "}
              {new Date(lastCompleted.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Progress bar */}
        {activeSession && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round((doneSets / totalSets) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${c.bg} transition-all duration-500 rounded-full`}
                style={{ width: `${(doneSets / totalSets) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Exercises */}
        <div className="flex flex-col gap-3 mb-6">
          {currentProgram.exercises.map((ex) =>
            activeSession ? (
              <ExerciseCard
                key={ex.name}
                sessionId={activeSession.id}
                exercise={ex}
                logs={logs}
                onLogsUpdate={setLogs}
              />
            ) : (
              <div key={ex.name} className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
                <p className="font-semibold text-gray-700 text-sm">{ex.name}</p>
                <p className="text-xs text-gray-400">{ex.sets} sets · {ex.reps} reps · {ex.weight}</p>
              </div>
            )
          )}
        </div>

        {/* Buttons */}
        {!activeSession ? (
          <button
            onClick={startWorkout}
            disabled={starting || !inited}
            className={`w-full ${c.bg} text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50`}
          >
            {starting ? "STARTING..." : "START WORKOUT"}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={cancelWorkout}
              className="flex-1 bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              onClick={finishWorkout}
              className={`flex-[2] ${c.bg} text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform`}
            >
              DONE ✓
            </button>
          </div>
        )}

        {/* Cycle pills */}
        <div className="flex justify-center gap-2 mt-6">
          {DAY_CYCLE.map((d) => (
            <div
              key={d}
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                d === dayType ? COLOR[d].badge : "bg-gray-100 text-gray-400"
              }`}
            >
              {PROGRAM[d].label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
