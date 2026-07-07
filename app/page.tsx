"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  PROGRAM, DAY_LABEL, getTodayType, localDate,
  Exercise, DayType,
} from "@/lib/program";
import { Session, Log, Override, AddedExercise } from "@/lib/types";
import { CheckinModal } from "@/components/CheckinModal";
import { HomeView } from "@/components/HomeView";
import { CoachView } from "@/components/CoachView";
import { StatsView } from "@/components/StatsView";
import { RecoveryModal } from "@/components/RecoveryModal";
import { WorkoutConfigModal } from "@/components/WorkoutConfigModal";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#09090b";
const SURFACE = "#111113";
const BORDER = "#27272a";
const MUTED = "#52525b";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
function parseWeight(w: string): number {
  const m = w.match(/(\d+(?:\.\d+)?)/g);
  return m ? parseFloat(m[m.length - 1]) : 0;
}
function parseReps(r: string): number {
  const m = r.match(/(\d+)/);
  return m ? parseInt(m[1]) : 10;
}


// ─── Active Exercise View ─────────────────────────────────────────────────────
function ActiveExerciseView({
  exercises, currentIdx, onNavigate,
  sessionId, logs, prevLogs, onLogsUpdate, dayColor,
  elapsed, pct, onRequestFinish, onCancel,
  weights, onWeightChange, dayLabel,
}: {
  exercises: Exercise[];
  currentIdx: number;
  onNavigate: (idx: number) => void;
  sessionId: number;
  logs: Log[];
  prevLogs: Log[];
  onLogsUpdate: (l: Log[]) => void;
  dayColor: string;
  elapsed: number;
  pct: number;
  onRequestFinish: () => void;
  onCancel: () => void;
  weights: Record<string, number>;
  onWeightChange: (name: string, kg: number) => void;
  dayLabel: string;
}) {
  const ex = exercises[currentIdx];
  const weightKg = weights[ex.name] !== undefined ? weights[ex.name] : parseWeight(ex.weight);
  const [busy, setBusy] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const hasAutoAdvanced = useRef(false);

  useEffect(() => { setBusy(false); setShowCancelConfirm(false); }, [ex.name]);
  useEffect(() => { hasAutoAdvanced.current = false; }, [ex.name]);

  const dr = parseReps(ex.reps);
  const saved = (sn: number) => logs.find(l => l.exercise_name === ex.name && l.set_number === sn);
  const doneSetsForEx = Array.from({ length: ex.sets }, (_, i) => i + 1).filter(s => !!saved(s)).length;
  const allDone = doneSetsForEx === ex.sets;
  const nextSet = allDone ? null : Array.from({ length: ex.sets }, (_, i) => i + 1).find(s => !saved(s)) ?? null;
  const isLastEx = currentIdx >= exercises.length - 1;

  const prevForEx = prevLogs.filter(l => l.exercise_name === ex.name && l.set_number > 0);
  const prevBest = prevForEx.length ? { kg: Math.max(...prevForEx.map(l => Number(l.weight_kg))) } : null;

  // Auto-advance when all sets done — guard against re-firing when user navigates back
  useEffect(() => {
    if (!allDone || isLastEx || hasAutoAdvanced.current) return;
    hasAutoAdvanced.current = true;
    const t = setTimeout(() => onNavigate(currentIdx + 1), 800);
    return () => clearTimeout(t);
  }, [allDone, currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markSet(sn: number, asDifficult = false) {
    if (busy) return;
    const snapshot = logs;
    const flag = asDifficult ? "difficult" : undefined;
    setBusy(true);
    onLogsUpdate([...logs, { exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: weightKg, flag }]);
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, exercise_name: ex.name, set_number: sn, reps: dr, weight_kg: weightKg, flag: flag ?? null }),
      });
    } catch { onLogsUpdate(snapshot); }
    setBusy(false);
    navigator.vibrate?.([40]);
  }

  async function unmarkSet(sn: number) {
    if (busy) return;
    const snapshot = logs;
    setBusy(true);
    onLogsUpdate(logs.filter(l => !(l.exercise_name === ex.name && l.set_number === sn)));
    try {
      const p = new URLSearchParams({ session_id: String(sessionId), exercise_name: ex.name, set_number: String(sn) });
      await fetch(`/api/logs?${p}`, { method: "DELETE" });
    } catch { onLogsUpdate(snapshot); }
    setBusy(false);
  }

  function adjustWeight(delta: number) {
    onWeightChange(ex.name, Math.max(0, Math.round((weightKg + delta) * 2) / 2));
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: BG, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${dayColor}0e 0%, transparent 60%)` }} />

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(9,9,11,0.96)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 20px", paddingBottom: "max(28px, calc(env(safe-area-inset-bottom) + 16px))" as unknown as string }}>
          <p className="font-racing" style={{ fontSize: 26, color: "#fff", textAlign: "center", marginBottom: 6 }}>Abandonner la séance ?</p>
          <p style={{ fontSize: 13, color: MUTED, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>Toutes les séries seront perdues.</p>
          <button onClick={onCancel} style={{ width: "100%", padding: "17px 0", borderRadius: 16, border: "none", background: "#EF4444", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>Abandonner</button>
          <button onClick={() => setShowCancelConfirm(false)} style={{ width: "100%", padding: "17px 0", borderRadius: 16, border: `1px solid ${BORDER}`, background: "transparent", color: "#9ca3af", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Continuer la séance</button>
        </div>
      )}

      {/* Navbar */}
      <div style={{ paddingTop: "max(20px, calc(env(safe-area-inset-top) + 16px))", paddingLeft: 20, paddingRight: 20, paddingBottom: 12, flexShrink: 0, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setShowCancelConfirm(true)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 1 1 6 6 11" />
            </svg>
            {dayLabel}
          </button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              Exercice {currentIdx + 1} / {exercises.length}
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", fontVariantNumeric: "tabular-nums", marginTop: 1 }}>{fmt(elapsed)}</p>
          </div>
          <button onClick={onRequestFinish} style={{ padding: "7px 12px", borderRadius: 10, border: pct === 100 ? "none" : `1px solid ${BORDER}`, background: pct === 100 ? "#fff" : SURFACE, color: pct === 100 ? BG : "#e5e7eb", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: pct === 100 ? "0 0 20px #ffffff55" : "none", flexShrink: 0 }}>
            {pct === 100 ? "Terminer ✓" : `Terminer · ${pct}%`}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: BORDER, flexShrink: 0, position: "relative", zIndex: 1 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#fff" : dayColor, boxShadow: `0 0 8px ${dayColor}66`, transition: "width 0.5s" }} />
      </div>

      {/* Exercise content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px 8px", position: "relative", zIndex: 1, overflow: "hidden" }}>

        {/* Navigation arrows */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 18 }}>
          <button onClick={() => currentIdx > 0 && onNavigate(currentIdx - 1)}
            style={{ width: 44, height: 44, borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: currentIdx > 0 ? "pointer" : "default", opacity: currentIdx > 0 ? 1 : 0.2 }}>
            <svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 1 1 7 8 13" />
            </svg>
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => currentIdx < exercises.length - 1 && onNavigate(currentIdx + 1)}
            style={{ width: 44, height: 44, borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: currentIdx < exercises.length - 1 ? "pointer" : "default", opacity: currentIdx < exercises.length - 1 ? 1 : 0.2 }}>
            <svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 1 8 7 1 13" />
            </svg>
          </button>
        </div>

        {/* Muscle tag */}
        <div style={{ fontSize: 11, fontWeight: 700, color: dayColor, background: `${dayColor}14`, border: `1px solid ${dayColor}44`, borderRadius: 8, padding: "5px 14px", marginBottom: 10 }}>
          {ex.muscle}
        </div>

        {/* Exercise name */}
        <p className="font-racing" style={{ fontSize: 34, color: "#fff", textAlign: "center", lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 10 }}>
          {ex.name}
        </p>

        {/* Reps — info principale */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14 }}>
          <span className="font-racing" style={{ fontSize: 80, color: "#F97316", lineHeight: 1, letterSpacing: "-0.02em" }}>{ex.reps}</span>
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.14em", marginTop: 2 }}>répétitions</span>
        </div>

        {/* Weight selector */}
        <div style={{ display: "flex", alignItems: "center", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", width: "100%", marginBottom: 14 }}>
          <button onClick={() => adjustWeight(-0.5)} style={{ width: 60, height: 52, background: "none", border: "none", color: "#a1a1aa", fontSize: 28, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span className="font-racing" style={{ fontSize: 28, fontStyle: "italic", color: weightKg > 0 ? "#fff" : MUTED }}>
              {weightKg > 0 ? `${weightKg} kg` : "Poids du corps"}
            </span>
            {prevBest && weightKg > 0 && weightKg > prevBest.kg && (
              <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 700, marginLeft: 8, letterSpacing: "0.05em" }}>NEW PR ↑</span>
            )}
          </div>
          <button onClick={() => adjustWeight(0.5)} style={{ width: 60, height: 52, background: "none", border: "none", color: "#a1a1aa", fontSize: 28, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>

        {/* Set dots */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" as const, justifyContent: "center" }}>
          {Array.from({ length: ex.sets }, (_, i) => {
            const sn = i + 1;
            const log = saved(sn);
            const isDifficult = log?.flag === "difficult";
            const isDone = !!log;
            const isNext = !isDone && sn === nextSet;
            const dotBg = isDifficult ? "#F59E0B" : isDone ? dayColor : isNext ? `${dayColor}10` : SURFACE;
            const dotBorder = isDifficult ? "#F59E0B" : isDone ? dayColor : isNext ? dayColor : BORDER;
            const dotTextColor = (isDone || isDifficult) ? "#fff" : isNext ? dayColor : MUTED;
            return (
              <button key={sn}
                onClick={() => isDone ? unmarkSet(sn) : isNext ? markSet(sn) : undefined}
                style={{ width: 46, height: 46, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, border: `2px solid ${dotBorder}`, background: dotBg, color: dotTextColor, boxShadow: isDifficult ? "0 0 14px #F59E0B55" : isDone ? `0 0 14px ${dayColor}55` : "none", cursor: isDone || isNext ? "pointer" : "default", transition: "background 0.2s, border-color 0.2s" }}>
                {isDifficult ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                ) : isDone ? "✓" : sn}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
          {doneSetsForEx} / {ex.sets} séries
        </p>

      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 20px 16px", flexShrink: 0, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => {
            if (allDone) { if (isLastEx) onRequestFinish(); else onNavigate(currentIdx + 1); }
            else if (nextSet) markSet(nextSet);
          }}
          disabled={busy}
          style={{ width: "100%", padding: 22, borderRadius: 18, border: "none", background: allDone ? (isLastEx ? "#fff" : dayColor) : "#F97316", color: allDone && isLastEx ? BG : "#fff", fontSize: 16, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, boxShadow: allDone ? (isLastEx ? "0 0 36px #ffffff44" : `0 0 36px ${dayColor}44`) : "0 0 36px #F9731644", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "…" : allDone ? (isLastEx ? "Terminer ✓" : "Exercice suivant →") : "Série faite ✓"}
        </button>
        <button
          onClick={() => nextSet ? markSet(nextSet, true) : undefined}
          disabled={busy || !nextSet}
          style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid ${BORDER}`, background: "transparent", color: !nextSet ? MUTED : "#a1a1aa", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: !nextSet ? "default" : "pointer", opacity: !nextSet ? 0.35 : 1 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Difficile — à améliorer
        </button>
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ page, onChange, workoutActive }: { page: number; onChange: (p: number) => void; workoutActive: boolean }) {
  const TABS = [
    {
      label: "Workout",
      icon: (c: string) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="8" width="4" height="6" rx="1" /><rect x="15" y="8" width="4" height="6" rx="1" /><line x1="7" y1="11" x2="15" y2="11" />
        </svg>
      ),
    },
    {
      label: "Stats",
      icon: (c: string) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="18" x2="4" y2="10" /><line x1="8" y1="18" x2="8" y2="14" /><line x1="12" y1="18" x2="12" y2="6" /><line x1="16" y1="18" x2="16" y2="12" /><line x1="20" y1="18" x2="20" y2="8" />
        </svg>
      ),
    },
    {
      label: "Coach",
      icon: (c: string) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="9" /><path d="M9 8.5c0-1.1.9-2 2-2s2 .9 2 2c0 1.7-2 2.5-2 4" /><circle cx="11" cy="15.5" r=".5" fill={c} />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ flexShrink: 0, background: BG, borderTop: "1px solid #1c1c1f", display: "flex", padding: "0 8px", paddingBottom: "max(0px, env(safe-area-inset-bottom))" as unknown as string }}>
      {TABS.map((tab, i) => {
        const isActive = page === i;
        const color = isActive ? "#F97316" : MUTED;
        return (
          <button key={i} onClick={() => onChange(i)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, paddingBottom: 6, gap: 4, background: "none", border: "none", cursor: "pointer", position: "relative" }}>
            {i === 0 && workoutActive && !isActive && (
              <div style={{ position: "absolute", top: 8, right: "calc(50% - 14px)", width: 7, height: 7, borderRadius: "50%", background: "#F97316", boxShadow: "0 0 6px #F97316" }} />
            )}
            {tab.icon(color)}
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Session Summary ──────────────────────────────────────────────────────────
interface SummaryData { duration: number; setsCompleted: number; totalSets: number; dayType: DayType; sessionId: number; muscles: string[]; difficultExercises: string[]; }

function SessionSummary({ data, sessions, onClose }: { data: SummaryData; sessions: Session[]; onClose: () => void }) {
  const [aiMsg, setAiMsg] = useState("");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [stretchPlan, setStretchPlan] = useState("");
  const [loadingStretch, setLoadingStretch] = useState(false);
  const { label, color } = DAY_LABEL[data.dayType];
  const pct = data.totalSets > 0 ? Math.round((data.setsCompleted / data.totalSets) * 100) : 0;
  const mins = Math.floor(data.duration / 60);
  const secs = data.duration % 60;

  useEffect(() => {
    const difficultPart = data.difficultExercises.length > 0
      ? ` Exercices difficiles : ${data.difficultExercises.join(", ")}.`
      : "";
    const msg = `Séance ${label} terminée : ${data.setsCompleted}/${data.totalSets} séries en ${mins}min${secs > 0 ? `${secs}s` : ""}.${difficultPart} Donne-moi un retour bref et un conseil ciblé.`;
    fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history: [], context: { sessions: sessions.slice(0, 10) } }),
    }).then(async res => {
      if (!res.ok) return;
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setAiMsg(text);
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveNotes() {
    if (!notes.trim() || notesSaved) return;
    await fetch(`/api/sessions/${data.sessionId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes.trim() }),
    }).catch(() => {});
    setNotesSaved(true);
  }

  async function getStretchPlan() {
    if (stretchPlan || loadingStretch) return;
    setLoadingStretch(true);
    const msg = `Génère un plan d'étirements de 5 min pour : ${data.muscles.join(", ")}. 5-6 étirements, chacun avec nom + durée + 1 instruction courte.`;
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, history: [], context: {} }) });
      if (!res.ok) return;
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setStretchPlan(text);
      }
    } catch {}
    setLoadingStretch(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, background: BG, display: "flex", flexDirection: "column", paddingTop: "max(56px, calc(env(safe-area-inset-top) + 24px))", paddingLeft: 24, paddingRight: 24, paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 16px))", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${color}18 0%, transparent 60%)` }} />
      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.14em", marginBottom: 8, position: "relative" }}>Séance terminée</p>
      <h2 className="font-racing" style={{ fontSize: 52, color: "#fff", letterSpacing: "-0.02em", marginBottom: 28, lineHeight: 1, position: "relative", textShadow: `0 0 40px ${color}44` }}>{label}</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, position: "relative" }}>
        {[
          { label: "Durée", value: mins, unit: "min" },
          { label: "Séries", value: data.setsCompleted, unit: `/${data.totalSets}` },
          { label: "Complétion", value: pct, unit: "%", hl: pct === 100 },
        ].map(({ label: l, value, unit, hl }) => (
          <div key={l} style={{ flex: 1, background: SURFACE, border: `1px solid ${hl ? color + "55" : BORDER}`, borderRadius: 18, padding: "16px 12px", boxShadow: hl ? `0 0 20px ${color}33` : "none" }}>
            <p style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{l}</p>
            <p className="font-racing" style={{ fontSize: 34, color: hl ? color : "#fff", lineHeight: 1, textShadow: hl ? `0 0 20px ${color}88` : "none" }}>
              {value}<span style={{ fontSize: 14, color: "#6b7280" }}>{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {data.difficultExercises.length > 0 && (
        <div style={{ background: SURFACE, border: "1px solid #F59E0B33", borderLeft: "3px solid #F59E0B", borderRadius: 18, padding: "14px 18px", marginBottom: 14, position: "relative" }}>
          <p style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            À améliorer
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {data.difficultExercises.map(name => (
              <span key={name} style={{ fontSize: 13, color: "#e5e7eb", background: "#F59E0B14", border: "1px solid #F59E0B44", borderRadius: 8, padding: "5px 10px" }}>{name}</span>
            ))}
          </div>
        </div>
      )}

      {aiMsg ? (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: "3px solid #0EA5E9", borderRadius: 20, padding: "18px 20px", marginBottom: 14, position: "relative" }}>
          <p style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>Analyse ARIA</p>
          <p style={{ fontSize: 15, color: "#e5e7eb", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiMsg}</p>
        </div>
      ) : (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "18px 20px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 13, color: MUTED }}>Analyse en cours…</p>
        </div>
      )}

      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: "hidden", marginBottom: 12 }}>
        <textarea value={notes} onChange={e => { setNotes(e.target.value); setNotesSaved(false); }} onBlur={saveNotes}
          placeholder="Note rapide sur cette séance… (sauvegardé auto)" rows={2}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 14, padding: "14px 16px", resize: "none" as const, lineHeight: 1.5, fontFamily: "inherit", boxSizing: "border-box" as const } as React.CSSProperties} />
        {notesSaved && <p style={{ fontSize: 11, color: MUTED, padding: "0 16px 10px", marginTop: -4 }}>Sauvegardé ✓</p>}
      </div>

      {!stretchPlan ? (
        <button onClick={getStretchPlan} disabled={loadingStretch}
          style={{ width: "100%", marginBottom: 10, padding: "14px 0", borderRadius: 14, border: `1px solid ${BORDER}`, background: "transparent", color: loadingStretch ? MUTED : "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {loadingStretch ? "Génération étirements…" : "Plan étirements ARIA →"}
        </button>
      ) : (
        <div style={{ marginBottom: 10, background: SURFACE, border: "1px solid #0EA5E933", borderRadius: 18, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>Étirements · 5 min</p>
          <p style={{ fontSize: 13, color: "#e5e7eb", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{stretchPlan}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={async () => {
          const text = `Séance ${label} terminée — ${data.setsCompleted}/${data.totalSets} séries en ${mins}min ! Streak en cours sur KAIVert.`;
          try { if (navigator.share) await navigator.share({ title: "KAIVert", text }); else await navigator.clipboard.writeText(text); } catch {}
        }} style={{ flex: 1, padding: "17px 0", borderRadius: 18, border: `1px solid ${BORDER}`, background: SURFACE, color: "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
          Partager ↗
        </button>
        <button onClick={onClose} style={{ flex: 2, padding: "17px 0", borderRadius: 18, border: "none", background: color, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: "0.08em", boxShadow: `0 0 28px ${color}55` }}>
          Fermer
        </button>
      </div>
    </div>
  );
}

// ─── Incomplete Confirm Modal ─────────────────────────────────────────────────
function IncompleteConfirmModal({ active, exercises, logs, elapsed, color, doneSets, totalSets, pct, onFinish, onCancel }: {
  active: Session; exercises: Exercise[]; logs: Log[]; elapsed: number; color: string;
  doneSets: number; totalSets: number; pct: number;
  onFinish: () => void; onCancel: () => void;
}) {
  const incomplete = exercises.filter(ex =>
    Array.from({ length: ex.sets }, (_, i) => i + 1).some(s => !logs.some(l => l.exercise_name === ex.name && l.set_number === s))
  );
  const difficultExercises = exercises.filter(ex => logs.some(l => l.exercise_name === ex.name && l.flag === "difficult"));
  const d = new Date(active.date + "T12:00:00");
  const dateLabel = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const mins = Math.floor(elapsed / 60);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: BG, display: "flex", flexDirection: "column", paddingTop: "max(56px, calc(env(safe-area-inset-top) + 24px))", paddingLeft: 24, paddingRight: 24, paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 16px))" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${color}14 0%, transparent 60%)` }} />
      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
        <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.14em", marginBottom: 6 }}>Terminer la séance</p>
        <p className="font-racing" style={{ fontSize: 42, color: "#fff", lineHeight: 1, marginBottom: 4 }}>Séance incomplète</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 28, textTransform: "capitalize" as const }}>{dateLabel}</p>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {([{ label: "Séries", value: `${doneSets}/${totalSets}` }, { label: "Complétion", value: `${pct}%` }, { label: "Durée", value: `${mins}min` }] as { label: string; value: string }[]).map(({ label, value }) => (
            <div key={label} style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "14px 10px", textAlign: "center" }}>
              <p style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{label}</p>
              <p className="font-racing" style={{ fontSize: 26, color: "#fff", lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        {incomplete.length > 0 && (
          <>
            <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 10 }}>Exercices non terminés</p>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
              {incomplete.map((ex, i) => {
                const done = Array.from({ length: ex.sets }, (_, j) => j + 1).filter(s => logs.some(l => l.exercise_name === ex.name && l.set_number === s)).length;
                return (
                  <div key={ex.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: i < incomplete.length - 1 ? `1px solid ${BG}` : "none" }}>
                    <span style={{ fontSize: 14, color: "#9ca3af" }}>{ex.name}</span>
                    <span className="font-racing" style={{ fontSize: 14, color: MUTED }}>{done}/{ex.sets}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {difficultExercises.length > 0 && (
          <>
            <p style={{ fontSize: 11, color: "#F59E0B", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Marqués difficiles
            </p>
            <div style={{ background: SURFACE, border: "1px solid #F59E0B33", borderRadius: 18, overflow: "hidden", marginBottom: 28 }}>
              {difficultExercises.map((ex, i) => (
                <div key={ex.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: i < difficultExercises.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <span style={{ fontSize: 14, color: "#e5e7eb" }}>{ex.name}</span>
                  <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, background: "#F59E0B18", border: "1px solid #F59E0B44", borderRadius: 6, padding: "3px 8px" }}>à améliorer</span>
                </div>
              ))}
            </div>
          </>
        )}

        {incomplete.length === 0 && difficultExercises.length === 0 && <div style={{ marginBottom: 28 }} />}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          <button onClick={onFinish} style={{ padding: "18px 0", borderRadius: 16, border: "none", background: color, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: "0.06em", boxShadow: `0 0 24px ${color}44` }}>
            Enregistrer quand même
          </button>
          <button onClick={onCancel} style={{ padding: "18px 0", borderRadius: 16, border: `1px solid ${BORDER}`, background: "transparent", color: "#6b7280", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Continuer la séance
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [active, setActive] = useState<Session | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [prevLogs, setPrevLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [page, setPage] = useState(0);
  const [formScore, setFormScore] = useState<number | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [focusedExIdx, setFocusedExIdx] = useState(0);
  const [showWorkoutConfig, setShowWorkoutConfig] = useState(false);
  const [addedExercises, setAddedExercises] = useState<Exercise[]>([]);
  const [ariaBrief, setAriaBrief] = useState("");
  const [progressData, setProgressData] = useState<Record<string, { date: string; weight: number; reps: number }[]>>({});
  const [weights, setWeights] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dayType = getTodayType();
  const { color } = DAY_LABEL[dayType];
  const baseExercises = PROGRAM[dayType];

  const permanentAdditions: Exercise[] = (() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(localStorage.getItem("kaivert_additions") ?? "{}");
      return (stored[dayType] ?? []) as Exercise[];
    } catch { return []; }
  })();

  const exercises = [
    ...baseExercises.map(ex => ({ ...ex, sets: overrides[ex.name]?.sets ?? ex.sets, weight: overrides[ex.name]?.weight ?? ex.weight })),
    ...permanentAdditions.map(ex => ({ ...ex, sets: overrides[ex.name]?.sets ?? ex.sets, weight: overrides[ex.name]?.weight ?? ex.weight })),
    ...addedExercises,
  ];

  // Workout timer
  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const start = new Date(active.created_at).getTime();
    const recalc = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    recalc();
    timerRef.current = setInterval(recalc, 1000);
    document.addEventListener("visibilitychange", recalc);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", recalc);
    };
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

  async function saveOverride(name: string, data: Override) {
    setOverrides(prev => ({ ...prev, [name]: { ...prev[name], ...data } }));
    await fetch("/api/program", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exercise_name: name, ...data }) }).catch(() => {});
  }

  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/init", { method: "POST" });
        const ovr = await fetch("/api/program").then(r => r.json()).catch(() => ({}));
        if (ovr && typeof ovr === "object") setOverrides(ovr);
        const today = localDate();
        const ci = await fetch(`/api/checkins?date=${today}`).then(r => r.json()).catch(() => null);
        if (!ci || ci.error) setShowCheckin(true);
        else if (ci.energy && ci.sleep_quality && ci.mood) {
          setFormScore(Math.round(((Number(ci.energy) + Number(ci.sleep_quality) + Number(ci.mood)) / 3) * 20));
        }
        fetch("/api/progress").then(r => r.json()).then(d => { if (d && typeof d === "object") setProgressData(d); }).catch(() => {});
        const data = await fetchSessions();
        const todaySess = data.find(s => s.date === today && !s.completed);
        if (todaySess) {
          setActive(todaySess);
          const r = await fetch(`/api/sessions/${todaySess.id}`);
          const logData = await r.json();
          if (Array.isArray(logData)) setLogs(logData);
          await loadPrevLogs(todaySess.day_type, todaySess.id, data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }

    async function generateBrief() {
      if (typeof window === "undefined") return;
      const today = localDate();
      const cacheKey = `kaivert_brief_${today}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setAriaBrief(cached); return; }
        const { label } = DAY_LABEL[getTodayType()];
        const msg = `Brief du jour (${label}). Analyse mes séances récentes. Dis-moi ce que je dois prioriser aujourd'hui. 2 phrases max, direct.`;
        const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, history: [], context: {} }) });
        if (!res.ok) return;
        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          setAriaBrief(text);
        }
        localStorage.setItem(cacheKey, text);
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("kaivert_brief_") && k !== cacheKey) localStorage.removeItem(k);
        }
      } catch {}
    }

    init().then(() => generateBrief());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStartWorkout(duration: number, mods: Record<string, Override>, added: AddedExercise[]) {
    void duration;
    const mergedOverrides = { ...overrides };
    if (Object.keys(mods).length > 0) {
      for (const [name, mod] of Object.entries(mods)) mergedOverrides[name] = { ...overrides[name], ...mod };
      setOverrides(mergedOverrides);
    }
    const sessionExercises = added.map(a => ({ name: a.name, sets: a.sets, reps: a.reps, weight: a.weight || "Poids du corps", muscle: a.muscle, tip: "" }));
    setAddedExercises(sessionExercises);
    const permanent = added.filter(a => a.permanent);
    if (permanent.length > 0) {
      try {
        const stored = JSON.parse(localStorage.getItem("kaivert_additions") ?? "{}");
        if (!stored[dayType]) stored[dayType] = [];
        for (const ex of permanent) {
          if (!stored[dayType].find((e: Exercise) => e.name === ex.name)) {
            stored[dayType].push({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight || "Poids du corps", muscle: ex.muscle, tip: "" });
          }
        }
        localStorage.setItem("kaivert_additions", JSON.stringify(stored));
      } catch {}
    }
    // Compute final exercise list immediately — don't wait for React state to flush
    const finalExercises: Exercise[] = [
      ...baseExercises.map(ex => ({ ...ex, sets: mergedOverrides[ex.name]?.sets ?? ex.sets, weight: mergedOverrides[ex.name]?.weight ?? ex.weight })),
      ...permanentAdditions.map(ex => ({ ...ex, sets: mergedOverrides[ex.name]?.sets ?? ex.sets, weight: mergedOverrides[ex.name]?.weight ?? ex.weight })),
      ...sessionExercises,
    ];
    setShowWorkoutConfig(false);
    void startWorkout(finalExercises);
  }

  async function startWorkout(finalExercises: Exercise[]) {
    setStarting(true);
    setFocusedExIdx(0);
    setPage(0);
    const initW: Record<string, number> = {};
    finalExercises.forEach(ex => { initW[ex.name] = parseWeight(ex.weight); });
    setWeights(initW);
    try {
      const today = localDate();
      const r = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day_type: dayType, date: today }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const sess = await r.json();
      setActive(sess);
      setLogs([]);
      setPrevLogs([]);
      const updated = await fetchSessions();
      await loadPrevLogs(dayType, sess.id, updated);
    } catch (e) { console.error(e); }
    finally { setStarting(false); }
  }

  async function finishWorkout() {
    if (!active) return;
    try {
      const res = await fetch(`/api/sessions/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, duration_seconds: elapsed > 0 ? elapsed : null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("Erreur sauvegarde séance:", e);
      return;
    }
    const difficultExercises = [...new Set(logs.filter(l => l.flag === "difficult").map(l => l.exercise_name))];
    setSummary({ duration: elapsed, setsCompleted: doneSets, totalSets, dayType, sessionId: active.id, muscles: [...new Set(exercises.map(ex => ex.muscle))], difficultExercises });
    setActive(null); setLogs([]); setPrevLogs([]); setConfirmFinish(false); setAddedExercises([]); setWeights({});
    fetchSessions().catch(() => {});
  }

  async function cancelWorkout() {
    if (!active) return;
    await fetch(`/api/sessions/${active.id}`, { method: "DELETE" });
    setActive(null); setLogs([]); setPrevLogs([]); setAddedExercises([]); setWeights({});
    fetchSessions();
  }

  const stagnantExercises = Object.entries(progressData)
    .filter(([, data]) => {
      if (data.length < 3) return false;
      const last3 = data.slice(-3);
      return last3[0].weight > 0 && last3.every(d => d.weight === last3[0].weight);
    })
    .map(([name]) => name);

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const doneSets = exercises.reduce((acc, ex) =>
    acc + Array.from({ length: ex.sets }, (_, i) => i + 1).filter(s => logs.some(l => l.exercise_name === ex.name && l.set_number === s)).length, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const yesterday = localDate(new Date(Date.now() - 86_400_000));
  const todayStr2 = localDate();
  const lastCompleted = sessions.find(s => s.completed);
  const isRestDay = !!lastCompleted && lastCompleted.date === yesterday && !sessions.some(s => s.completed && s.date === todayStr2);

  if (loading) return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <p style={{ color: MUTED, fontSize: 14 }}>Chargement…</p>
    </div>
  );

  return (
    <div style={{ height: "100svh", display: "flex", flexDirection: "column", background: BG }}>
      {showCheckin && <CheckinModal onClose={() => { setShowCheckin(false); fetch(`/api/checkins?date=${localDate()}`).then(r => r.json()).then(ci => { if (ci?.energy) setFormScore(Math.round(((Number(ci.energy) + Number(ci.sleep_quality) + Number(ci.mood)) / 3) * 20)); }).catch(() => {}); }} />}
      {showRecovery && <RecoveryModal sessions={sessions} onClose={() => setShowRecovery(false)} />}
      {summary && <SessionSummary data={summary} sessions={sessions} onClose={() => setSummary(null)} />}
      {confirmFinish && active && pct < 100 && (
        <IncompleteConfirmModal active={active} exercises={exercises} logs={logs} elapsed={elapsed} color={color} doneSets={doneSets} totalSets={totalSets} pct={pct} onFinish={finishWorkout} onCancel={() => setConfirmFinish(false)} />
      )}
      {showWorkoutConfig && (
        <WorkoutConfigModal dayType={dayType} exercises={exercises} sessions={sessions} formScore={formScore} color={color} onStart={handleStartWorkout} onCancel={() => setShowWorkoutConfig(false)} />
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: 0 }}>
        <div style={{ display: page === 0 ? "flex" : "none", flexDirection: "column", height: "100%" }}>
          {active
            ? <ActiveExerciseView
                exercises={exercises}
                currentIdx={focusedExIdx}
                onNavigate={setFocusedExIdx}
                sessionId={active.id}
                logs={logs}
                prevLogs={prevLogs}
                onLogsUpdate={setLogs}
                dayColor={color}
                elapsed={elapsed}
                pct={pct}
                onRequestFinish={() => pct === 100 ? finishWorkout() : setConfirmFinish(true)}
                onCancel={cancelWorkout}
                weights={weights}
                onWeightChange={(name, kg) => setWeights(prev => ({ ...prev, [name]: kg }))}
                dayLabel={DAY_LABEL[dayType].label}
              />
            : <HomeView
                sessions={sessions}
                onStart={() => setShowWorkoutConfig(true)}
                starting={starting}
                onCheckin={() => setShowCheckin(true)}
                dayType={dayType}
                formScore={formScore}
                overrides={overrides}
                onSaveOverride={saveOverride}
                onRecovery={() => setShowRecovery(true)}
                isRestDay={isRestDay}
                ariaBrief={ariaBrief}
                stagnantExercises={stagnantExercises}
              />
          }
        </div>
        <div style={{ display: page === 1 ? "flex" : "none", flexDirection: "column", height: "100%" }}>
          <StatsView sessions={sessions} />
        </div>
        <div style={{ display: page === 2 ? "flex" : "none", flexDirection: "column", height: "100%" }}>
          <CoachView sessions={sessions} ariaBrief={ariaBrief} stagnantExercises={stagnantExercises} />
        </div>
      </div>

      {/* Bottom tab bar */}
      <TabBar page={page} onChange={setPage} workoutActive={!!active} />
    </div>
  );
}
