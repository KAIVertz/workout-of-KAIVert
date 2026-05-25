"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  PROGRAM, DAY_LABEL, getTodayType, localDate,
  computeStreak, Exercise, DayType,
} from "@/lib/program";
import { CheckinModal } from "@/components/CheckinModal";
import { HomeView } from "@/components/HomeView";
import { CoachView } from "@/components/CoachView";
import { HistoryView } from "@/components/HistoryView";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
  id: number; date: string; day_type: string;
  completed: boolean; created_at: string; duration_seconds?: number;
}
interface Log {
  exercise_name: string; set_number: number;
  reps: number; weight_kg: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
function parseWeight(w: string): number {
  const m = w.match(/(\d+)/); return m ? parseInt(m[1]) : 0;
}
function parseReps(r: string): number {
  const m = r.match(/(\d+)/); return m ? parseInt(m[1]) : 10;
}

// ─── Rest Timer ───────────────────────────────────────────────────────────────
function RestTimer({ onDone }: { onDone: () => void }) {
  const [secs, setSecs] = useState(60);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(ref.current!); navigator.vibrate?.([200, 100, 200]); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, []);

  const pct = ((60 - secs) / 60) * 100;
  return (
    <div style={{ marginTop: 12, padding: "10px 14px", background: "#10101a", borderRadius: 12, border: "1px solid #1a1a2e", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Repos</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: secs === 0 ? "#0041C2" : "#fff", fontVariantNumeric: "tabular-nums" }}>
            {secs === 0 ? "Go !" : `${secs}s`}
          </span>
        </div>
        <div style={{ height: 3, background: "#1a1a2e", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#0041C2", borderRadius: 2, transition: "width 1s linear" }} />
        </div>
      </div>
      <button onClick={onDone} style={{ background: "none", border: "none", color: "#374151", fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({
  ex, sessionId, logs, prevLogs, onLogsUpdate, accent,
}: {
  ex: Exercise; sessionId: number;
  logs: Log[]; prevLogs: Log[];
  onLogsUpdate: (l: Log[]) => void;
  accent: string;
}) {
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [resting, setResting] = useState(false);

  const dw = parseWeight(ex.weight);
  const dr = parseReps(ex.reps);
  const saved = (sn: number) => logs.find(l => l.exercise_name === ex.name && l.set_number === sn);
  const doneSets = Array.from({ length: ex.sets }, (_, i) => i + 1).filter(s => saved(s)).length;
  const allDone = doneSets === ex.sets;

  const prevForEx = prevLogs.filter(l => l.exercise_name === ex.name && l.set_number > 0);
  const prevMax = prevForEx.length
    ? { reps: Math.max(...prevForEx.map(l => l.reps)), kg: Math.max(...prevForEx.map(l => Number(l.weight_kg))) }
    : null;

  async function tap(sn: number) {
    if (busy.has(sn)) return;
    setError(null);
    const existing = saved(sn);
    const snapshot = logs;
    if (existing) {
      onLogsUpdate(logs.filter(l => !(l.exercise_name === ex.name && l.set_number === sn)));
    } else {
      onLogsUpdate([...logs, { exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: dw }]);
    }
    setBusy(b => new Set(b).add(sn));
    try {
      const res = await fetch("/api/logs", {
        method: existing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existing
          ? { session_id: sessionId, exercise_name: ex.name, set_number: sn }
          : { session_id: sessionId, exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: dw }
        ),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      onLogsUpdate(snapshot);
      setError("Erreur réseau — retente");
    }
    setBusy(b => { const s = new Set(b); s.delete(sn); return s; });
    if (!existing) setResting(true);
  }

  return (
    <div style={{ borderBottom: "1px solid #1a1a2e", opacity: allDone ? 0.45 : 1, transition: "opacity 0.3s" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", textAlign: "left", padding: "16px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{ex.name}</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{ex.muscle}</span>
          </div>
          {prevMax && (
            <p style={{ fontSize: 11, color: "#374151", marginTop: 3 }}>
              Dernière fois : {prevMax.reps} reps · {prevMax.kg}kg
            </p>
          )}
          <p style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{ex.sets} × {ex.reps} · {ex.weight}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12, paddingTop: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: allDone ? accent : "#374151", fontWeight: allDone ? 600 : 400 }}>
            {allDone ? "✓" : `${doneSets}/${ex.sets}`}
          </span>
          <span style={{ fontSize: 11, color: "#374151" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ paddingBottom: 20 }}>
          {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: ex.sets }, (_, i) => i + 1).map(s => {
              const done = !!saved(s);
              const isBusy = busy.has(s);
              return (
                <button key={s} onClick={() => tap(s)} disabled={isBusy}
                  style={{
                    width: 52, height: 52, borderRadius: 14, border: "none",
                    fontWeight: 700, fontSize: 16, cursor: isBusy ? "wait" : "pointer",
                    transition: "background 0.15s, color 0.15s, transform 0.1s",
                    background: done ? accent : "#10101a",
                    color: done ? "#fff" : "#6b7280",
                    outline: done ? "none" : "1px solid #1a1a2e",
                    transform: isBusy ? "scale(0.95)" : "scale(1)",
                    opacity: isBusy ? 0.7 : 1,
                  }}>
                  {isBusy ? "…" : s}
                </button>
              );
            })}
          </div>
          {resting && <RestTimer onDone={() => setResting(false)} />}
          <p style={{ fontSize: 12, color: "#374151", fontStyle: "italic", marginTop: 12, lineHeight: 1.5 }}>{ex.tip}</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TAB_LABELS = ["Aujourd'hui", "Coach", "Historique"];

function TabBar({ page, onChange }: { page: number; onChange: (p: number) => void }) {
  return (
    <div style={{
      flexShrink: 0,
      paddingTop: "max(14px, calc(env(safe-area-inset-top) + 6px))",
      background: "#08080d",
      borderBottom: "1px solid #1a1a2e",
    }}>
      <div style={{ display: "flex", maxWidth: 480, margin: "0 auto" }}>
        {TAB_LABELS.map((label, i) => (
          <button key={i} onClick={() => onChange(i)}
            style={{
              flex: 1, padding: "12px 0 14px", background: "none", border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: page === i ? 700 : 500,
              color: page === i ? "#fff" : "#374151",
              borderBottom: page === i ? "2px solid #0041C2" : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [prevLogs, setPrevLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dayType = getTodayType();
  const { color } = DAY_LABEL[dayType];
  const exercises = PROGRAM[dayType];

  // Workout timer
  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const start = new Date(active.created_at).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchSessions = useCallback(async () => {
    const r = await fetch("/api/sessions");
    const data = await r.json();
    const arr: Session[] = Array.isArray(data) ? data : [];
    setSessions(arr);
    return arr;
  }, []);

  async function loadPrevLogs(dayT: string, excludeId: number, allSessions: Session[]) {
    const prev = allSessions.find(s => s.completed && s.day_type === dayT && s.id !== excludeId);
    if (!prev) return;
    const r = await fetch(`/api/sessions/${prev.id}`);
    const data = await r.json();
    if (Array.isArray(data)) setPrevLogs(data);
  }

  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/init", { method: "POST" });
        const today = localDate();
        const data = await fetchSessions();
        const todaySess = data.find(s => s.date === today && !s.completed);
        if (todaySess) {
          setActive(todaySess);
          const r = await fetch(`/api/sessions/${todaySess.id}`);
          const logData = await r.json();
          if (Array.isArray(logData)) setLogs(logData);
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
    setStarting(true);
    try {
      const today = localDate();
      const r = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_type: dayType, date: today }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const sess = await r.json();
      setActive(sess);
      setLogs([]);
      setPrevLogs([]);
      const updated = await fetchSessions();
      await loadPrevLogs(dayType, sess.id, updated);
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  }

  async function finishWorkout() {
    if (!active) return;
    await fetch(`/api/sessions/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, duration_seconds: elapsed }),
    });
    setActive(null); setLogs([]); setPrevLogs([]); setConfirmFinish(false);
    fetchSessions();
  }

  async function cancelWorkout() {
    if (!active) return;
    await fetch(`/api/sessions/${active.id}`, { method: "DELETE" });
    setActive(null); setLogs([]); setPrevLogs([]);
    fetchSessions();
  }

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const doneSets = exercises.reduce((acc, ex) =>
    acc + Array.from({ length: ex.sets }, (_, i) => i + 1)
      .filter(s => logs.some(l => l.exercise_name === ex.name && l.set_number === s)).length, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  if (loading) return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "#08080d" }}>
      <p style={{ color: "#374151", fontSize: 14 }}>Chargement…</p>
    </div>
  );

  // ── ACTIVE WORKOUT ───────────────────────────────────────────────────────────
  if (active) {
    return (
      <div style={{ minHeight: "100svh", background: "#08080d" }}>
        <div style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "#08080d", borderBottom: "1px solid #1a1a2e",
          paddingTop: "max(48px, calc(env(safe-area-inset-top) + 16px))",
          paddingLeft: 20, paddingRight: 20, paddingBottom: 16,
        }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button onClick={cancelWorkout}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 14 }}>
                Annuler
              </button>
              <span style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                {fmt(elapsed)}
              </span>
              <button
                onClick={() => pct === 100 ? finishWorkout() : setConfirmFinish(c => !c)}
                style={{
                  padding: "8px 16px", borderRadius: 12, border: "none",
                  cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "all 0.2s",
                  background: pct === 100 ? "#fff" : confirmFinish ? color : "#10101a",
                  color: pct === 100 ? "#08080d" : confirmFinish ? "#fff" : "#6b7280",
                  outline: confirmFinish || pct === 100 ? "none" : "1px solid #1a1a2e",
                }}>
                {pct === 100 ? "Terminer ✓" : confirmFinish ? "Confirmer" : `${pct}%`}
              </button>
            </div>
            <div style={{ height: 2, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, transition: "width 0.5s", width: `${pct}%`, background: pct === 100 ? "#fff" : color }} />
            </div>
            {confirmFinish && pct < 100 && (
              <p style={{ fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 8 }}>
                Appuie encore sur « Confirmer » pour enregistrer à {pct}%
              </p>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
          {exercises.map(ex => (
            <ExerciseCard key={ex.name} ex={ex}
              sessionId={active.id} logs={logs} prevLogs={prevLogs}
              onLogsUpdate={setLogs} accent={color} />
          ))}
          <div style={{ paddingTop: 32 }}>
            {confirmFinish ? (
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setConfirmFinish(false)}
                  style={{ flex: 1, padding: "16px 0", borderRadius: 16, border: "1px solid #1a1a2e", background: "transparent", color: "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Continuer
                </button>
                <button onClick={finishWorkout}
                  style={{ flex: 1, padding: "16px 0", borderRadius: 16, border: "none", background: color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Terminer
                </button>
              </div>
            ) : (
              <button onClick={() => pct === 100 ? finishWorkout() : setConfirmFinish(true)}
                style={{
                  width: "100%", padding: "18px 0", borderRadius: 16,
                  border: pct === 100 ? "none" : "1px solid #1a1a2e",
                  background: pct === 100 ? "#fff" : "transparent",
                  color: pct === 100 ? "#08080d" : "#6b7280",
                  fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                }}>
                {pct === 100 ? "Terminer la séance ✓" : `Terminer (${pct}%)`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── TAB CONTAINER ────────────────────────────────────────────────────────────
  return (
    <div style={{ height: "100svh", display: "flex", flexDirection: "column", background: "#08080d" }}>
      {showCheckin && <CheckinModal onClose={() => setShowCheckin(false)} />}

      <TabBar page={page} onChange={setPage} />

      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ display: page === 0 ? "flex" : "none", flexDirection: "column", height: "100%" }}>
          <HomeView sessions={sessions} onStart={startWorkout} starting={starting} onCheckin={() => setShowCheckin(true)} dayType={dayType} />
        </div>
        <div style={{ display: page === 1 ? "flex" : "none", flexDirection: "column", height: "100%" }}>
          <CoachView sessions={sessions} />
        </div>
        <div style={{ display: page === 2 ? "flex" : "none", flexDirection: "column", height: "100%" }}>
          <HistoryView sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
