"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PROGRAM, DAY_LABEL, getTodayType, localDate, computeStreak, getMissedDays, Exercise } from "@/lib/program";
import { ExerciseIllustration } from "@/components/ExerciseIllustration";
import { TopNav } from "@/components/BottomNav";

interface Session {
  id: number; date: string; day_type: string;
  completed: boolean; created_at: string; duration_seconds?: number;
}
interface Log { exercise_name: string; set_number: number; reps: number; weight_kg: number; }

function parseWeight(w: string) { const m = w.match(/(\d+)/); return m ? +m[1] : 0; }
function parseReps(r: string)   { const m = r.match(/(\d+)/); return m ? +m[1] : 10; }
function fmt(s: number) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`; }

// ─── Exercise Card ─────────────────────────────────────────────────────────────
function ExerciseCard({
  ex, sessionId, logs, onLogsUpdate, color,
}: {
  ex: Exercise; sessionId: number;
  logs: Log[]; onLogsUpdate: (l: Log[]) => void; color: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const dw = parseWeight(ex.weight);
  const dr = parseReps(ex.reps);

  const saved = (sn: number) => logs.find((l) => l.exercise_name === ex.name && l.set_number === sn);
  const doneSets = Array.from({ length: ex.sets }, (_, i) => i + 1).filter((s) => saved(s)).length;
  const warmupDone = !!saved(0);
  const allDone = warmupDone && doneSets === ex.sets;

  async function tap(sn: number) {
    if (busy.has(sn)) return;
    const exists = saved(sn);
    if (exists) {
      onLogsUpdate(logs.filter((l) => !(l.exercise_name === ex.name && l.set_number === sn)));
    } else {
      onLogsUpdate([...logs, { exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: dw }]);
    }
    setBusy((b) => new Set(b).add(sn));
    await fetch(exists ? "/api/logs" : "/api/logs", {
      method: exists ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exists
        ? { session_id: sessionId, exercise_name: ex.name, set_number: sn }
        : { session_id: sessionId, exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: dw }
      ),
    });
    setBusy((b) => { const s = new Set(b); s.delete(sn); return s; });
  }

  return (
    <div style={{ opacity: allDone ? 0.4 : 1 }} className="transition-opacity">
      {/* Header — always visible */}
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between py-5 border-b border-[#0f0f0f] text-left">
        <div className="flex-1">
          <p className="text-white font-semibold text-base leading-tight">{ex.name}</p>
          <p className="text-[#444] text-xs mt-1.5 uppercase tracking-wider">{ex.muscle} · {ex.sets} × {ex.reps} · {ex.weight}</p>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0 pt-0.5">
          {/* Mini set indicators */}
          <div className="flex gap-1">
            {Array.from({ length: ex.sets }, (_, i) => i + 1).map((s) => (
              <div key={s} className="w-1.5 h-1.5 rounded-full"
                style={{ background: saved(s) ? color : "#222" }} />
            ))}
          </div>
          <span className="text-[#2a2a2a] text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="py-6 border-b border-[#111]">
          {/* Illustration */}
          <div className="flex justify-center mb-5">
            <div style={{ opacity: 0.7 }}>
              <ExerciseIllustration type={ex.illustration} />
            </div>
          </div>

          {/* Tip */}
          <p className="text-[#555] text-sm leading-relaxed mb-7 italic">{ex.tip}</p>

          {/* Sets — numbered buttons */}
          <div className="space-y-4">
            {/* Warmup */}
            <div className="flex items-center gap-3">
              <button onClick={() => tap(0)} disabled={busy.has(0)}
                className="w-12 h-12 rounded-2xl text-sm font-bold transition-all disabled:opacity-40 border"
                style={warmupDone
                  ? { background: "#ca8a04", borderColor: "#ca8a04", color: "#000" }
                  : { borderColor: "#ca8a04", color: "#ca8a04", background: "transparent" }}>
                W
              </button>
              <div>
                <p className="text-xs text-[#333] uppercase tracking-wider">Échauffement</p>
                <p className="text-xs text-[#222] mt-0.5">Poids léger · {ex.reps} reps</p>
              </div>
            </div>

            {/* Working sets */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: ex.sets }, (_, i) => i + 1).map((s) => (
                <button key={s} onClick={() => tap(s)} disabled={busy.has(s)}
                  className="w-12 h-12 rounded-2xl text-base font-bold transition-all disabled:opacity-40 border"
                  style={saved(s)
                    ? { background: color, borderColor: color, color: "#000" }
                    : { borderColor: "#1e1e1e", color: "#444", background: "transparent" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dayType = getTodayType();
  const { label, sub, color } = DAY_LABEL[dayType];
  const exercises = PROGRAM[dayType];

  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const start = new Date(active.created_at).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSessions = useCallback(async () => {
    const r = await fetch("/api/sessions");
    const data = await r.json();
    const arr: Session[] = Array.isArray(data) ? data : [];
    setSessions(arr);
    return arr;
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/init", { method: "POST" });
        const data = await fetchSessions();
        const today = localDate();
        const todaySess = data.find((s) => s.date === today && !s.completed);
        if (todaySess) {
          setActive(todaySess);
          const r = await fetch(`/api/sessions/${todaySess.id}`);
          setLogs(await r.json());
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startWorkout() {
    setStarting(true);
    try {
      const r = await fetch("/api/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_type: dayType }),
      });
      const sess = await r.json();
      setActive(sess); setLogs([]);
      fetchSessions();
    } finally { setStarting(false); }
  }

  async function finishWorkout() {
    if (!active) return;
    await fetch(`/api/sessions/${active.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, duration_seconds: elapsed }),
    });
    setActive(null); setLogs([]); setConfirmFinish(false);
    fetchSessions();
  }

  async function cancelWorkout() {
    if (!active) return;
    await fetch(`/api/sessions/${active.id}`, { method: "DELETE" });
    setActive(null); setLogs([]);
    fetchSessions();
  }

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const doneSets = exercises.reduce((acc, ex) =>
    acc + Array.from({ length: ex.sets }, (_, i) => i + 1).filter((s) =>
      logs.some((l) => l.exercise_name === ex.name && l.set_number === s)
    ).length, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const streak = computeStreak(sessions);
  const missed = getMissedDays(sessions);
  const completedCount = sessions.filter((s) => s.completed).length;

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-[#333] text-sm">…</p>
    </div>
  );

  // ── ACTIVE WORKOUT ──────────────────────────────────────────────────────────
  if (active) {
    return (
      <div className="min-h-screen bg-black">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 bg-black px-5 pt-12 pb-5">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button onClick={cancelWorkout} className="text-[#444] text-sm hover:text-[#666] transition-colors">
                Annuler
              </button>
              <span className="text-4xl font-black tabular-nums tracking-tighter">{fmt(elapsed)}</span>
              <button
                onClick={() => pct === 100 ? finishWorkout() : setConfirmFinish(!confirmFinish)}
                className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
                style={pct === 100
                  ? { background: "#fff", color: "#000" }
                  : confirmFinish
                  ? { background: color, color: "#000" }
                  : { background: "#111", color: "#666", border: "1px solid #1a1a1a" }}>
                {pct === 100 ? "Terminer ✓" : confirmFinish ? "Confirmer" : `${pct}%`}
              </button>
            </div>
            {/* Progress bar */}
            <div className="h-0.5 bg-[#111] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: pct === 100 ? "#fff" : color }} />
            </div>
          </div>
        </div>

        {/* Exercise list */}
        <div className="max-w-md mx-auto px-5 pb-16">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.name} ex={ex}
              sessionId={active.id} logs={logs}
              onLogsUpdate={setLogs} color={color} />
          ))}

          {/* Inline finish button */}
          <div className="pt-8 pb-4">
            {confirmFinish ? (
              <div className="space-y-3">
                <p className="text-[#444] text-sm text-center">Terminer à {pct}% ?</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmFinish(false)}
                    className="flex-1 py-4 rounded-2xl border border-[#1a1a1a] text-[#555] text-sm font-semibold">
                    Continuer
                  </button>
                  <button onClick={finishWorkout}
                    className="flex-1 py-4 rounded-2xl text-black text-sm font-bold"
                    style={{ background: color }}>
                    Terminer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => pct === 100 ? finishWorkout() : setConfirmFinish(true)}
                className="w-full py-4 rounded-2xl text-sm font-bold transition-all"
                style={pct === 100
                  ? { background: "#fff", color: "#000" }
                  : { background: "#111", color: "#555", border: "1px solid #1a1a1a" }}>
                {pct === 100 ? "Terminer la séance ✓" : `Terminer (${pct}%)`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto">

        {/* Hero header — colored block */}
        <div className="px-5 pt-12 pb-8" style={{ background: color }}>
          <TopNav light />

          <div className="mt-10">
            {/* Day label */}
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-2">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-7xl font-black tracking-tighter text-white leading-none uppercase">
              {label}
            </h1>
            <p className="text-white/50 text-sm mt-3 font-medium">{sub}</p>
          </div>

          {/* Stats in header */}
          <div className="flex items-end justify-between mt-8">
            {streak > 0 ? (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest">Série</p>
                <p className="text-white font-black text-4xl leading-none mt-1">{streak}<span className="text-white/50 text-lg font-normal ml-1">j</span></p>
              </div>
            ) : <div />}
            {completedCount > 0 && (
              <div className="text-right">
                <p className="text-white/40 text-xs uppercase tracking-widest">Séances</p>
                <p className="text-white font-black text-4xl leading-none mt-1">{completedCount}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content on black */}
        <div className="px-5">

          {/* Adaptation message */}
          {missed >= 1 && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl border border-[#1a1a1a]">
              <span style={{ color }} className="text-sm mt-0.5 font-bold">↑</span>
              <p className="text-[#777] text-sm leading-relaxed">
                {missed === 1
                  ? "Tu as raté hier — reviens fort."
                  : `${missed} jours d'arrêt — intensité max aujourd'hui.`}
              </p>
            </div>
          )}

          {/* Programme preview */}
          <div className="mt-8 mb-2">
            <p className="text-[#333] text-xs uppercase tracking-widest font-semibold mb-5">Programme</p>
            <div className="space-y-px">
              {exercises.map((ex, i) => (
                <div key={ex.name}
                  className={`flex items-center justify-between py-4 ${i < exercises.length - 1 ? "border-b border-[#0d0d0d]" : ""}`}>
                  <div>
                    <p className="text-white font-medium">{ex.name}</p>
                    <p className="text-[#333] text-xs mt-1 uppercase tracking-wide">{ex.muscle}</p>
                  </div>
                  <p className="text-[#555] text-sm tabular-nums ml-6 shrink-0 font-mono">
                    {ex.sets}×{ex.reps}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <div className="pt-8 pb-12">
            <button
              onClick={startWorkout}
              disabled={starting}
              className="w-full py-5 rounded-2xl text-black font-black text-lg uppercase tracking-wider disabled:opacity-50 transition-opacity"
              style={{ background: color }}>
              {starting ? "…" : `Commencer`}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
