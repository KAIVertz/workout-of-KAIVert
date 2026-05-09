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
  ex, totalSets, sessionId, logs, onLogsUpdate, accentColor,
}: {
  ex: Exercise; totalSets: number; sessionId: number;
  logs: Log[]; onLogsUpdate: (l: Log[]) => void; accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const dw = parseWeight(ex.weight);
  const dr = parseReps(ex.reps);

  const saved = (sn: number) => logs.find((l) => l.exercise_name === ex.name && l.set_number === sn);
  const doneSets = Array.from({ length: totalSets }, (_, i) => i + 1).filter((s) => saved(s)).length;
  const warmupDone = !!saved(0);
  const allDone = warmupDone && doneSets === totalSets;

  async function tap(sn: number) {
    if (busy.has(sn)) return;
    const exists = saved(sn);
    if (exists) {
      onLogsUpdate(logs.filter((l) => !(l.exercise_name === ex.name && l.set_number === sn)));
    } else {
      onLogsUpdate([...logs, { exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: dw }]);
    }
    setBusy((b) => new Set(b).add(sn));
    if (exists) {
      await fetch("/api/logs", { method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, exercise_name: ex.name, set_number: sn }) });
    } else {
      await fetch("/api/logs", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: dw }) });
    }
    setBusy((b) => { const s = new Set(b); s.delete(sn); return s; });
  }

  return (
    <div className={`border-b border-[#0f0f0f] transition-opacity ${allDone ? "opacity-40" : ""}`}>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left">
        <div className="flex-1">
          <div className="flex items-baseline gap-2.5">
            <p className="text-white font-medium">{ex.name}</p>
            <p className="text-[#444] text-xs">{ex.muscle}</p>
          </div>
          <p className="text-[#333] text-xs mt-1">{totalSets} × {ex.reps} · {ex.weight}</p>
        </div>
        <div className="flex items-center gap-3 ml-3 shrink-0">
          <p className="text-[#333] text-xs tabular-nums">{doneSets}/{totalSets}</p>
          <span className="text-[#2a2a2a] text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="pb-6">
          <div className="flex justify-center mb-5 opacity-70">
            <ExerciseIllustration type={ex.illustration} />
          </div>
          <p className="text-[#555] text-sm italic leading-relaxed mb-6">{ex.tip}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => tap(0)} disabled={busy.has(0)} title="Échauffement"
              className={`w-5 h-5 rounded-full border transition-all disabled:opacity-40 ${
                warmupDone ? "bg-[#ca8a04] border-[#ca8a04]" : "border-[#ca8a04]/40"}`}
            />
            <div className="w-px h-4 bg-[#1a1a1a]" />
            {Array.from({ length: totalSets }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => tap(s)} disabled={busy.has(s)}
                className={`w-8 h-8 rounded-full border transition-all disabled:opacity-40 ${
                  saved(s) ? "border-transparent" : "border-[#2a2a2a] hover:border-[#555]"}`}
                style={saved(s) ? { background: accentColor } : {}}
              />
            ))}
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

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-[#333] text-sm">Chargement…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">

      {/* ── ACTIVE WORKOUT ─────────────────────────────────────────────────── */}
      {active ? (
        <div className="max-w-md mx-auto">
          {/* Sticky top bar with timer + actions */}
          <div className="sticky top-0 bg-black z-20 px-5 pt-12 pb-4 border-b border-[#111]">
            <div className="flex items-center justify-between mb-3">
              <button onClick={cancelWorkout}
                className="text-[#444] text-sm hover:text-[#777] transition-colors">
                Annuler
              </button>
              <span className="text-2xl font-bold tabular-nums">{fmt(elapsed)}</span>
              {confirmFinish ? (
                <button onClick={finishWorkout}
                  className="text-sm font-semibold px-4 py-1.5 rounded-xl text-black"
                  style={{ background: color }}>
                  Confirmer
                </button>
              ) : (
                <button
                  onClick={() => pct === 100 ? finishWorkout() : setConfirmFinish(true)}
                  className="text-sm font-semibold px-4 py-1.5 rounded-xl transition-all"
                  style={pct === 100
                    ? { background: "#fff", color: "#000" }
                    : { background: "#161616", color: "#555", border: "1px solid #1e1e1e" }}>
                  {pct === 100 ? "Terminer ✓" : `${pct}%`}
                </button>
              )}
            </div>
            {/* Progress bar */}
            <div className="h-px bg-[#111] overflow-hidden">
              <div className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct === 100 ? "#fff" : color }} />
            </div>
            {confirmFinish && (
              <p className="text-[#555] text-xs mt-3 text-center">
                Appuie encore sur &ldquo;Confirmer&rdquo; pour enregistrer la séance
              </p>
            )}
          </div>

          {/* Exercise list — scrolls freely */}
          <div className="px-5 pb-16">
            {exercises.map((ex) => (
              <ExerciseCard key={ex.name} ex={ex} totalSets={ex.sets}
                sessionId={active.id} logs={logs}
                onLogsUpdate={setLogs} accentColor={color} />
            ))}

            {/* Inline finish button at the very bottom */}
            <div className="pt-8 pb-4">
              {confirmFinish ? (
                <div className="flex gap-3">
                  <button onClick={() => setConfirmFinish(false)}
                    className="flex-1 py-4 rounded-2xl border border-[#1e1e1e] text-[#555] text-sm">
                    Retour
                  </button>
                  <button onClick={finishWorkout}
                    className="flex-1 py-4 rounded-2xl text-black text-sm font-semibold"
                    style={{ background: color }}>
                    Terminer la séance
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => pct === 100 ? finishWorkout() : setConfirmFinish(true)}
                  className="w-full py-4 rounded-2xl text-sm font-semibold transition-all"
                  style={pct === 100
                    ? { background: "#fff", color: "#000" }
                    : { background: "#111", color: "#555", border: "1px solid #1a1a1a" }}>
                  {pct === 100 ? "Terminer ✓" : `Terminer la séance (${pct}%)`}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (

        /* ── IDLE ──────────────────────────────────────────────────────────── */
        <div className="max-w-md mx-auto">
          <TopNav />

          <div className="px-5">
            {/* Date + title */}
            <div className="pt-8 pb-6">
              <p className="text-[#444] text-sm mb-3">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-5xl font-bold tracking-tight" style={{ color }}>{label}</h1>
                  <p className="text-[#444] text-sm mt-2">{sub}</p>
                </div>
                {streak > 0 && (
                  <div className="text-right mt-1">
                    <p className="text-white font-bold text-3xl">{streak}</p>
                    <p className="text-[#444] text-xs mt-0.5">jours</p>
                  </div>
                )}
              </div>
            </div>

            {/* Adaptation message */}
            {missed >= 1 && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl border border-[#1a1a1a]">
                <span className="text-amber-400 text-sm mt-0.5">↑</span>
                <p className="text-[#777] text-sm leading-relaxed">
                  {missed === 1
                    ? "Tu as raté hier — reviens fort aujourd'hui."
                    : missed === 2
                    ? `${missed} jours sans séance — intensité maximale.`
                    : `${missed} jours d'arrêt. Les muscles t'attendent.`}
                </p>
              </div>
            )}

            {/* Exercise preview */}
            <div className="mb-8">
              <p className="text-[#333] text-xs uppercase tracking-widest mb-5">Programme du jour</p>
              <div className="space-y-1">
                {exercises.map((ex) => (
                  <div key={ex.name} className="flex items-center justify-between py-3 border-b border-[#0d0d0d]">
                    <div>
                      <p className="text-white text-sm">{ex.name}</p>
                      <p className="text-[#333] text-xs mt-0.5">{ex.muscle}</p>
                    </div>
                    <p className="text-[#444] text-sm tabular-nums ml-4 shrink-0">{ex.sets} × {ex.reps}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {sessions.filter((s) => s.completed).length > 0 && (
              <div className="flex gap-8 mb-10">
                <div>
                  <p className="text-[#333] text-xs mb-1">Série en cours</p>
                  <p className="text-white font-semibold">{streak} jour{streak > 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-[#333] text-xs mb-1">Total</p>
                  <p className="text-white font-semibold">{sessions.filter((s) => s.completed).length} séances</p>
                </div>
              </div>
            )}

            {/* Start button — inline, always visible */}
            <div className="pb-12">
              <button
                onClick={startWorkout}
                disabled={starting}
                className="w-full py-5 rounded-2xl text-black text-base font-semibold disabled:opacity-50"
                style={{ background: color }}>
                {starting ? "Démarrage…" : `Commencer ${label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
