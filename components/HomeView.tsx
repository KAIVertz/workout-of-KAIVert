"use client";
import { useState } from "react";
import { DAY_LABEL, PROGRAM, localDate, computeStreak, getNextDayType, getEquipment, DayType, Exercise } from "@/lib/program";
import { Session, Override } from "@/lib/types";

interface Props {
  sessions: Session[];
  onStart: () => void;
  starting: boolean;
  onCheckin: () => void;
  dayType: DayType;
  formScore: number | null;
  overrides: Record<string, Override>;
  onSaveOverride: (name: string, data: Override) => Promise<void>;
  onRecovery: () => void;
  isRestDay: boolean;
  ariaBrief?: string;
  stagnantExercises?: string[];
}

const BG = "#09090b";
const SURFACE = "#111113";
const BORDER = "#27272a";
const MUTED = "#52525b";
const MUTED2 = "#a1a1aa";
const ACCENT = "#F97316";

const WEIGHT_PRESETS = ["Poids du corps", "5kg", "7kg", "13kg"];

function ExerciseEditRow({ ex, override, onSave, color }: { ex: Exercise; override: Override; onSave: (data: Override) => void; color: string }) {
  const [sets, setSets] = useState(override.sets ?? ex.sets);
  const [weight, setWeight] = useState(override.weight ?? ex.weight);
  const changed = sets !== (override.sets ?? ex.sets) || weight !== (override.weight ?? ex.weight);

  return (
    <div style={{ padding: "12px 0", borderBottom: `1px solid ${BG}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "#e5e7eb", fontWeight: 600 }}>{ex.name}</span>
        <span style={{ fontSize: 11, color: MUTED }}>{ex.muscle}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: MUTED, width: 56 }}>Séries</span>
        <button onClick={() => setSets(s => Math.max(1, s - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: BG, border: `1px solid ${BORDER}`, color: MUTED2, fontSize: 18, cursor: "pointer" }}>−</button>
        <span className="font-racing" style={{ fontSize: 20, color: "#fff", width: 28, textAlign: "center" }}>{sets}</span>
        <button onClick={() => setSets(s => Math.min(8, s + 1))} style={{ width: 32, height: 32, borderRadius: 8, background: BG, border: `1px solid ${BORDER}`, color: MUTED2, fontSize: 18, cursor: "pointer" }}>+</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
        <span style={{ fontSize: 11, color: MUTED, width: 56 }}>Charge</span>
        {WEIGHT_PRESETS.map(w => (
          <button key={w} onClick={() => setWeight(w)}
            style={{ padding: "5px 10px", borderRadius: 8, border: weight === w ? `1.5px solid ${color}` : `1px solid ${BORDER}`, background: weight === w ? `${color}18` : BG, color: weight === w ? "#fff" : MUTED, fontSize: 11, cursor: "pointer" }}>
            {w}
          </button>
        ))}
      </div>
      {changed && (
        <button onClick={() => onSave({ sets, weight })}
          style={{ marginTop: 10, width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: color, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Enregistrer
        </button>
      )}
    </div>
  );
}

export function HomeView({ sessions, onStart, starting, onCheckin, dayType, formScore, overrides, onSaveOverride, onRecovery, isRestDay, ariaBrief, stagnantExercises = [] }: Props) {
  const [editMode, setEditMode] = useState(false);
  const { label, sub, color } = DAY_LABEL[dayType];
  const baseExercises = PROGRAM[dayType];
  const exercises: Exercise[] = baseExercises.map(ex => ({
    ...ex,
    sets: overrides[ex.name]?.sets ?? ex.sets,
    weight: overrides[ex.name]?.weight ?? ex.weight,
  }));
  const streak = computeStreak(sessions);

  const tomorrowType = getNextDayType();
  const tomorrowInfo = DAY_LABEL[tomorrowType];
  const tomorrowExercises: Exercise[] = PROGRAM[tomorrowType].map(ex => ({
    ...ex,
    sets: overrides[ex.name]?.sets ?? ex.sets,
    weight: overrides[ex.name]?.weight ?? ex.weight,
  }));
  const todayEquipment = getEquipment(exercises);
  const tomorrowEquipment = getEquipment(tomorrowExercises);

  const today = new Date();
  const todayDow = today.getDay();
  const mondayOffset = (todayDow + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sessionDateMap = new Map<string, string>();
  sessions.filter(s => s.completed).forEach(s => {
    const info = DAY_LABEL[s.day_type as DayType];
    if (info) sessionDateMap.set(s.date, info.color);
  });

  const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];
  const todayStr = localDate();
  const dateLabel = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 80% 45% at 50% 0%, ${color}12 0%, transparent 70%)` }} />

      <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1, padding: "max(20px, calc(env(safe-area-inset-top) + 12px)) 20px max(32px, calc(env(safe-area-inset-bottom) + 20px))" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <p className="font-racing" style={{ fontSize: 38, color: "#fff", lineHeight: 0.85, letterSpacing: "-0.02em" }}>Daily Compound</p>
            <p style={{ fontSize: 12, color: MUTED, textTransform: "capitalize" as const, marginTop: 5 }}>{dateLabel}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {formScore !== null && (
              <div onClick={onCheckin} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 99, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <span className="font-racing" style={{ fontSize: 18, color: formScore >= 70 ? "#22C55E" : formScore >= 45 ? "#D97706" : "#EF4444", lineHeight: 1 }}>{formScore}</span>
                <span style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>forme</span>
              </div>
            )}
            {streak > 0 && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 99, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="font-racing" style={{ fontSize: 22, color: ACCENT, lineHeight: 1 }}>{streak}</span>
                <span style={{ fontSize: 11, color: MUTED }}>jours</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Day card */}
        <div style={{ background: SURFACE, border: `1px solid ${color}44`, borderTop: `3px solid ${color}`, borderRadius: 20, padding: "16px 18px", marginBottom: 14, boxShadow: `0 4px 28px ${color}0c` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p className="font-racing" style={{ fontSize: 34, color: "#fff", lineHeight: 1 }}>{label}</p>
              <p style={{ fontSize: 11, color: MUTED2, marginTop: 3 }}>{sub}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}44`, borderRadius: 8, padding: "4px 10px" }}>
              {exercises.reduce((a, e) => a + e.sets, 0)} séries
            </span>
          </div>

          {/* Week strip */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              const dateStr = localDate(d);
              const sessionColor = sessionDateMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const isFuture = d > today;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: isToday ? "#fff" : MUTED, fontWeight: isToday ? 700 : 400 }}>{DAY_LETTERS[i]}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: sessionColor ? `${sessionColor}1a` : isFuture ? "transparent" : "#0c0c0e", border: isToday ? `1.5px solid ${color}` : sessionColor ? `1px solid ${sessionColor}66` : `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isToday ? `0 0 8px ${color}44` : sessionColor ? `0 0 8px ${sessionColor}44` : "none" }}>
                    {sessionColor && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={sessionColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${sessionColor}99)` }}>
                        <polyline points="2 7 5.5 10.5 12 3.5" />
                      </svg>
                    )}
                    {isToday && !sessionColor && <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, opacity: 0.8 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exercise list */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.12em", fontWeight: 700 }}>Programme du jour</span>
            <button onClick={() => setEditMode(e => !e)}
              style={{ padding: "4px 10px", borderRadius: 8, border: editMode ? `1.5px solid ${color}` : `1px solid ${BORDER}`, background: editMode ? `${color}18` : SURFACE, color: editMode ? "#fff" : MUTED, fontSize: 11, cursor: "pointer" }}>
              {editMode ? "Fermer ✓" : "Modifier ✎"}
            </button>
          </div>

          {editMode ? (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "0 18px", marginBottom: 14 }}>
              {baseExercises.map(ex => (
                <ExerciseEditRow key={ex.name} ex={ex} override={overrides[ex.name] ?? {}} onSave={data => onSaveOverride(ex.name, data)} color={color} />
              ))}
            </div>
          ) : (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: "hidden" }}>
              {exercises.map((ex, i) => (
                <div key={ex.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 18px", borderBottom: i < exercises.length - 1 ? `1px solid ${BG}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0, opacity: 0.7 }} />
                    <span style={{ fontSize: 14, color: "#e4e4e7", fontWeight: 500 }}>{ex.name}</span>
                    {stagnantExercises.includes(ex.name) && (
                      <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, background: "#F59E0B18", border: "1px solid #F59E0B44", borderRadius: 6, padding: "2px 6px", letterSpacing: "0.04em" }}>↑ charge</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: MUTED }}>{ex.sets}×{ex.reps}{ex.weight !== "Poids du corps" && ex.weight !== "" ? ` · ${ex.weight}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment */}
        {(todayEquipment.length > 0 || tomorrowEquipment.length > 0) && (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "14px 18px", marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 12 }}>Équipement à prévoir</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {todayEquipment.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color, fontWeight: 700, marginBottom: 6 }}>Aujourd&apos;hui · {label}</p>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {todayEquipment.map(item => (
                      <span key={item} style={{ fontSize: 12, color: "#e4e4e7", background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 10px" }}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {tomorrowEquipment.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: tomorrowInfo.color, fontWeight: 700, marginBottom: 6 }}>Demain · {tomorrowInfo.label}</p>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {tomorrowEquipment.map(item => (
                      <span key={item} style={{ fontSize: 12, color: "#e4e4e7", background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 10px" }}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ARIA brief */}
        {ariaBrief && (
          <div style={{ background: "#040d14", border: "1px solid #0EA5E922", borderLeft: "3px solid #0EA5E9", borderRadius: 18, padding: "14px 18px", marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0EA5E9", boxShadow: "0 0 6px #0EA5E9", display: "inline-block" }} />
              ARIA
            </p>
            <p style={{ fontSize: 14, color: "#e4e4e7", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ariaBrief}</p>
          </div>
        )}

        {/* Rest day banner */}
        {isRestDay && (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: "3px solid #6b7280", borderRadius: 18, padding: "16px 18px", marginBottom: 16 }}>
            <p className="font-racing" style={{ fontSize: 20, color: "#fff", marginBottom: 4 }}>Repos recommandé</p>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Tu t&apos;es entraîné hier — ton corps a besoin de récupérer.</p>
            <button onClick={onRecovery} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1px solid ${BORDER}`, background: "transparent", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Plan récupération active →
            </button>
          </div>
        )}

        {/* Start button */}
        <button onClick={onStart} disabled={starting}
          style={{ width: "100%", padding: "20px 0", borderRadius: 18, border: "none", background: starting ? `${ACCENT}99` : ACCENT, color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, cursor: starting ? "wait" : "pointer", boxShadow: starting ? "none" : `0 0 32px #F9731644, 0 4px 16px #F9731622`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "-apple-system, sans-serif" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
          </svg>
          {starting ? "Démarrage…" : isRestDay ? "Faire quand même →" : "Commencer"}
        </button>

        {!isRestDay && (
          <button onClick={onRecovery} style={{ width: "100%", marginTop: 14, background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", letterSpacing: "0.04em" }}>
            ou prendre une journée de récup active →
          </button>
        )}
      </div>
    </div>
  );
}
