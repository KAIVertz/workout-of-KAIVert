"use client";
import { useEffect, useState } from "react";
import { DAY_LABEL, PROGRAM, DayType, localDate } from "@/lib/program";
import { Session, Goal, NutritionLog } from "@/lib/types";

interface PR { exercise_name: string; max_weight: number; best_reps: number; }
type ProgressData = Record<string, { date: string; weight: number; reps: number }[]>;

const PROTEIN_TARGET = 90;

const ACCENT = "#F97316";

function ProgressChart({ data, color }: { data: { date: string; weight: number }[]; color: string }) {
  if (!data.length) return null;
  const pts = data.slice(-12);
  const weights = pts.map(d => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const W = 300; const H = 72;
  const pad = 8;
  const coords = pts.map((d, i) => ({
    x: pts.length === 1 ? W / 2 : pad + (i / (pts.length - 1)) * (W - pad * 2),
    y: H - pad - ((d.weight - minW) / range) * (H - pad * 2),
  }));
  const polyline = coords.map(p => `${p.x},${p.y}`).join(" ");
  const area = `${coords[0].x},${H} ${polyline} ${coords[coords.length - 1].x},${H}`;
  const last = coords[coords.length - 1];
  const first = coords[0];
  const trend = pts.length > 1 ? pts[pts.length - 1].weight - pts[0].weight : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="font-racing" style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>
          {pts[pts.length - 1].weight} <span style={{ fontSize: 14, color: "#6b7280", fontStyle: "normal" }}>kg</span>
        </span>
        <span style={{ fontSize: 12, color: trend > 0 ? "#059669" : trend < 0 ? "#E8002D" : "#374151", fontWeight: 600 }}>
          {trend > 0 ? `+${trend.toFixed(1)}` : trend < 0 ? trend.toFixed(1) : "—"} kg
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 72, overflow: "visible" }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#grad-${color.replace("#", "")})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === coords.length - 1 ? 5 : 3}
            fill={color} style={{ filter: i === coords.length - 1 ? `drop-shadow(0 0 6px ${color})` : "none" }} />
        ))}
        <text x={first.x} y={H} fontSize="9" fill="#374151" textAnchor="middle">{pts[0].date.slice(5)}</text>
        {pts.length > 1 && (
          <text x={last.x} y={H} fontSize="9" fill="#6b7280" textAnchor="middle">{pts[pts.length - 1].date.slice(5)}</text>
        )}
      </svg>
    </div>
  );
}

export function StatsView({ sessions }: { sessions: Session[] }) {
  const [prs, setPrs] = useState<PR[]>([]);
  const [progress, setProgress] = useState<ProgressData>({});
  const [selectedEx, setSelectedEx] = useState<string | null>(null);
  const [reminderHour, setReminderHour] = useState<number | null>(null);
  const [reminderSaving, setReminderSaving] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalLabel, setGoalLabel] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalUnit, setGoalUnit] = useState("kg");
  const [goalDeadline, setGoalDeadline] = useState("");

  // Nutrition state
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealProtein, setMealProtein] = useState("");

  const today = localDate();

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => { if (d.records) setPrs(d.records); }).catch(() => {});
    fetch("/api/progress").then(r => r.json()).then(d => {
      setProgress(d);
      const keys = Object.keys(d);
      if (keys.length > 0 && !selectedEx) setSelectedEx(keys[0]);
    }).catch(() => {});
    fetch("/api/settings").then(r => r.json()).then(d => {
      const h = d.reminder_hour !== undefined ? parseInt(d.reminder_hour) : null;
      if (h !== null && h >= 0) setReminderHour(h);
    }).catch(() => {});
    fetch("/api/goals").then(r => r.json()).then(d => { if (Array.isArray(d)) setGoals(d); }).catch(() => {});
    fetch(`/api/nutrition?date=${today}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setNutritionLogs(d); }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveReminder(hour: number | null) {
    setReminderSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminder_hour: hour !== null ? String(hour) : "-1" }),
      });
      setReminderHour(hour);
    } catch {}
    setReminderSaving(false);
  }

  async function addGoal() {
    if (!goalLabel.trim() || !goalTarget) return;
    const res = await fetch("/api/goals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: goalLabel.trim(), target_value: parseFloat(goalTarget), unit: goalUnit, deadline: goalDeadline || undefined }),
    }).catch(() => null);
    if (!res?.ok) return;
    const g = await res.json();
    setGoals(prev => [g, ...prev]);
    setGoalLabel(""); setGoalTarget(""); setGoalDeadline(""); setShowGoalForm(false);
  }

  async function deleteGoal(id: number) {
    await fetch("/api/goals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  async function updateGoalProgress(id: number, current: number) {
    await fetch("/api/goals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, current_value: current }) }).catch(() => {});
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current_value: current } : g));
  }

  async function addMeal() {
    if (!mealName.trim() || !mealProtein) return;
    const res = await fetch("/api/nutrition", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, meal: mealName.trim(), protein_g: parseInt(mealProtein) }),
    }).catch(() => null);
    if (!res?.ok) return;
    const log = await res.json();
    setNutritionLogs(prev => [...prev, log]);
    setMealName(""); setMealProtein(""); setShowNutritionForm(false);
  }

  async function deleteMeal(id: number) {
    await fetch("/api/nutrition", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    setNutritionLogs(prev => prev.filter(l => l.id !== id));
  }

  const completed = sessions.filter(s => s.completed);
  const todayDate = new Date();

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(todayDate);
    const mondayOffset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - mondayOffset - (7 - i - 1) * 7);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setDate(d.getDate() + 7);
    const label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const count = completed.filter(s => {
      const sd = new Date(s.date + "T12:00:00");
      return sd >= d && sd < end;
    }).length;
    return { label: i === 6 ? "Auj." : label, count, isCurrent: i === 6 };
  });

  const maxCount = Math.max(...weeks.map(w => w.count), 1);

  const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const monthSessions = completed.filter(s => new Date(s.date + "T12:00:00") >= monthStart);
  const muscleCounts: Record<string, { count: number; color: string }> = {};
  monthSessions.forEach(s => {
    const info = DAY_LABEL[s.day_type as DayType];
    const exs = PROGRAM[s.day_type as DayType] ?? [];
    const muscles = [...new Set(exs.map(e => e.muscle))];
    muscles.forEach(m => {
      if (!muscleCounts[m]) muscleCounts[m] = { count: 0, color: info?.color ?? ACCENT };
      muscleCounts[m].count++;
    });
  });
  const sortedMuscles = Object.entries(muscleCounts).sort((a, b) => b[1].count - a[1].count);
  const maxMuscle = sortedMuscles[0]?.[1].count ?? 1;

  const totalSessions = completed.length;
  const totalMin = Math.round(completed.reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / 60);
  const thisWeekCount = weeks[6].count;
  const lastWeekCount = weeks[5].count;
  const vsLastWeek = thisWeekCount - lastWeekCount;

  const progressExercises = Object.keys(progress);
  const selectedData = selectedEx ? progress[selectedEx] ?? [] : [];

  return (
    <div style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${ACCENT}12 0%, transparent 65%)` }} />
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1, padding: "max(20px, calc(env(safe-area-inset-top) + 12px)) 20px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p className="font-racing" style={{ fontSize: 38, fontWeight: 900, fontStyle: "italic", color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>STATS</p>
            <p style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>Progression · Muscles · Records</p>
          </div>

          {/* Top stats */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total", value: totalSessions, unit: "séances", unitColor: "#6b7280" },
              { label: "Temps", value: totalMin < 60 ? totalMin : Math.round(totalMin / 60), unit: totalMin < 60 ? "min" : "heures", unitColor: "#6b7280" },
              { label: "Sem.", value: thisWeekCount, unit: vsLastWeek !== 0 || lastWeekCount > 0 ? (vsLastWeek >= 0 ? `+${vsLastWeek} vs S-1` : `${vsLastWeek} vs S-1`) : "séances", unitColor: vsLastWeek > 0 ? "#059669" : vsLastWeek < 0 ? "#E8002D" : "#6b7280" },
            ].map(({ label, value, unit, unitColor }) => (
              <div key={label} style={{ flex: 1, background: "#111113", border: "1px solid #1a1a2e", borderRadius: 18, padding: "16px 14px" }}>
                <p style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</p>
                <p className="font-racing" style={{ fontSize: 34, fontWeight: 900, fontStyle: "italic", color: "#fff", lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: unitColor, marginTop: 4 }}>{unit}</p>
              </div>
            ))}
          </div>

          {/* Progression par exercice */}
          {progressExercises.length > 0 && (
            <>
              <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                Progression · Charges
              </p>
              {/* Exercise selector */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4, WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                {progressExercises.map(ex => (
                  <button key={ex} onClick={() => setSelectedEx(ex)}
                    style={{
                      flexShrink: 0, padding: "7px 12px", borderRadius: 20,
                      border: selectedEx === ex ? `1.5px solid ${ACCENT}` : "1px solid #1a1a2e",
                      background: selectedEx === ex ? `${ACCENT}1a` : "#111113",
                      color: selectedEx === ex ? "#fff" : "#6b7280",
                      fontSize: 11, fontWeight: selectedEx === ex ? 700 : 400,
                      cursor: "pointer", whiteSpace: "nowrap",
                      boxShadow: selectedEx === ex ? `0 0 12px ${ACCENT}33` : "none",
                    }}>
                    {ex}
                  </button>
                ))}
              </div>
              {selectedEx && selectedData.length > 0 && (
                <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 22, padding: "18px 20px", marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: "#374151", marginBottom: 12 }}>{selectedEx} · {selectedData.length} séance{selectedData.length > 1 ? "s" : ""}</p>
                  <ProgressChart data={selectedData} color={ACCENT} />
                </div>
              )}
            </>
          )}

          {/* Volume chart */}
          <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
            Séances · 8 semaines
          </p>
          <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 22, padding: "20px 16px 14px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 92 }}>
              {weeks.map((w, i) => {
                const barH = w.count > 0 ? Math.max((w.count / maxCount) * 76, 10) : 0;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                    {w.count > 0 && <span className="font-racing" style={{ fontSize: 13, fontWeight: 700, color: w.isCurrent ? "#fff" : "#6b7280" }}>{w.count}</span>}
                    <div style={{ width: "100%", height: barH || 3, borderRadius: 6, background: w.isCurrent ? ACCENT : w.count > 0 ? `${ACCENT}44` : "#27272a", boxShadow: w.isCurrent && w.count > 0 ? `0 0 14px ${ACCENT}66` : "none", transition: "height 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
              {weeks.map((w, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <span style={{ fontSize: 9, color: w.isCurrent ? "#6b7280" : "#2a2a3e", display: "block" }}>{w.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Muscle frequency */}
          <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Muscles · Ce mois</p>
          <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 22, padding: "18px 20px", marginBottom: 20 }}>
            {sortedMuscles.length === 0 ? (
              <p style={{ fontSize: 13, color: "#374151" }}>Aucune séance ce mois.</p>
            ) : sortedMuscles.map(([muscle, { count, color }], i) => (
              <div key={muscle} style={{ marginBottom: i < sortedMuscles.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>{muscle}</span>
                  <span className="font-racing" style={{ fontSize: 15, fontWeight: 700, color }}>{count}×</span>
                </div>
                <div style={{ height: 5, background: "#27272a", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${(count / maxMuscle) * 100}%`, background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}88`, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* PRs */}
          {prs.length > 0 && (
            <>
              <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Records personnels</p>
              <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 22, overflow: "hidden" }}>
                {prs.map((pr, i) => (
                  <div key={pr.exercise_name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < prs.length - 1 ? "1px solid #0d0d1a" : "none" }}>
                    <span style={{ fontSize: 13, color: "#d1d5db", flex: 1, marginRight: 12 }}>{pr.exercise_name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexShrink: 0 }}>
                      <span className="font-racing" style={{ fontSize: 18, fontWeight: 800, color: ACCENT, textShadow: `0 0 12px ${ACCENT}88` }}>{pr.max_weight} kg</span>
                      <span style={{ fontSize: 11, color: "#374151" }}>× {pr.best_reps}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Nutrition — protéines du jour */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 }}>
            <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em" }}>Protéines · Aujourd&apos;hui</p>
            <button onClick={() => setShowNutritionForm(v => !v)}
              style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid #1a1a2e", background: showNutritionForm ? "#F9731618" : "transparent", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
              {showNutritionForm ? "Annuler" : "+ Repas"}
            </button>
          </div>
          {showNutritionForm && (
            <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
              <input value={mealName} onChange={e => setMealName(e.target.value)} placeholder="Nom du repas (ex: tofu, lentilles…)"
                style={{ width: "100%", background: "#09090b", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box" } as React.CSSProperties} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={mealProtein} onChange={e => setMealProtein(e.target.value)} placeholder="Protéines (g)" type="number" min="0"
                  style={{ flex: 1, background: "#09090b", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none" } as React.CSSProperties} />
                <button onClick={addMeal}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Ajouter
                </button>
              </div>
            </div>
          )}
          <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 22, padding: "18px 20px", marginBottom: 20 }}>
            {(() => {
              const total = nutritionLogs.reduce((a, l) => a + l.protein_g, 0);
              const pct = Math.min((total / PROTEIN_TARGET) * 100, 100);
              const barColor = total >= PROTEIN_TARGET ? "#059669" : total >= 60 ? "#D97706" : "#E8002D";
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                    <span className="font-racing" style={{ fontSize: 42, fontWeight: 900, fontStyle: "italic", color: "#fff", lineHeight: 1 }}>
                      {total}<span style={{ fontSize: 16, color: "#6b7280", fontStyle: "normal", marginLeft: 4 }}>g</span>
                    </span>
                    <span style={{ fontSize: 13, color: barColor, fontWeight: 700 }}>{total}/{PROTEIN_TARGET}g objectif</span>
                  </div>
                  <div style={{ height: 6, background: "#27272a", borderRadius: 4, marginBottom: 16 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, boxShadow: `0 0 10px ${barColor}88`, transition: "width 0.5s" }} />
                  </div>
                  {nutritionLogs.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#374151" }}>Aucun repas enregistré aujourd&apos;hui.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {nutritionLogs.map(l => (
                        <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#9ca3af" }}>{l.meal}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="font-racing" style={{ fontSize: 15, fontWeight: 700, color: ACCENT }}>{l.protein_g}g</span>
                            <button onClick={() => deleteMeal(l.id)} style={{ background: "none", border: "none", color: "#374151", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Objectifs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em" }}>Objectifs</p>
            <button onClick={() => setShowGoalForm(v => !v)}
              style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid #1a1a2e", background: showGoalForm ? "#F9731618" : "transparent", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
              {showGoalForm ? "Annuler" : "+ Objectif"}
            </button>
          </div>
          {showGoalForm && (
            <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
              <input value={goalLabel} onChange={e => setGoalLabel(e.target.value)} placeholder="Ex: Curl à 10kg, 30 sauts de corde…"
                style={{ width: "100%", background: "#09090b", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box" } as React.CSSProperties} />
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Valeur cible" type="number" min="0"
                  style={{ flex: 1, background: "#09090b", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none" } as React.CSSProperties} />
                <select value={goalUnit} onChange={e => setGoalUnit(e.target.value)}
                  style={{ background: "#09090b", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", cursor: "pointer" }}>
                  {["kg", "reps", "séries", "s", "min"].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} placeholder="Échéance (optionnel)" type="date"
                  style={{ flex: 1, background: "#09090b", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 12px", color: "#6b7280", fontSize: 14, outline: "none" } as React.CSSProperties} />
                <button onClick={addGoal}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Créer
                </button>
              </div>
            </div>
          )}
          {goals.length > 0 && (
            <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 22, overflow: "hidden", marginBottom: 20 }}>
              {goals.map((g, i) => {
                const pct = g.target_value > 0 ? Math.min((Number(g.current_value) / Number(g.target_value)) * 100, 100) : 0;
                const done = pct >= 100;
                const barColor = done ? "#059669" : ACCENT;
                return (
                  <div key={g.id} style={{ padding: "16px 18px", borderBottom: i < goals.length - 1 ? "1px solid #0d0d1a" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1, marginRight: 12 }}>
                        <p style={{ fontSize: 14, color: done ? "#059669" : "#e5e7eb", fontWeight: 600 }}>{g.label}{done ? " ✓" : ""}</p>
                        {g.deadline && <p style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>Échéance : {new Date(g.deadline + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span className="font-racing" style={{ fontSize: 15, fontWeight: 700, color: barColor }}>{Number(g.current_value)}<span style={{ fontSize: 11, color: "#374151" }}>/{Number(g.target_value)}{g.unit}</span></span>
                        <button onClick={() => deleteGoal(g.id)} style={{ background: "none", border: "none", color: "#374151", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "#27272a", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, boxShadow: `0 0 8px ${barColor}66`, transition: "width 0.5s" }} />
                    </div>
                    {!done && (
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        {[0.25, 0.5, 0.75, 1].map(f => {
                          const val = Math.round(Number(g.target_value) * f * 10) / 10;
                          const isActive = Math.abs(Number(g.current_value) - val) < 0.05;
                          return (
                            <button key={f} onClick={() => updateGoalProgress(g.id, val)}
                              style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: isActive ? `1.5px solid ${ACCENT}` : "1px solid #1a1a2e", background: isActive ? `${ACCENT}18` : "transparent", color: isActive ? "#fff" : "#374151", fontSize: 11, cursor: "pointer" }}>
                              {Math.round(f * 100)}%
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {goals.length === 0 && !showGoalForm && (
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 20 }}>Aucun objectif. Tape + pour en créer un.</p>
          )}

          {/* Reminder settings */}
          <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, marginTop: 8 }}>Rappel d&apos;entraînement</p>
          <div style={{ background: "#111113", border: "1px solid #1a1a2e", borderRadius: 22, padding: "20px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: reminderHour !== null ? 18 : 0 }}>
              <div>
                <p style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 600 }}>Notification quotidienne</p>
                <p style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>Heure de Paris (Europe/Paris)</p>
              </div>
              <button
                onClick={() => reminderHour !== null ? saveReminder(null) : saveReminder(8)}
                disabled={reminderSaving}
                style={{
                  width: 52, height: 28, borderRadius: 14, border: "none",
                  background: reminderHour !== null ? ACCENT : "#27272a",
                  position: "relative", cursor: "pointer", transition: "background 0.2s",
                  boxShadow: reminderHour !== null ? `0 0 14px ${ACCENT}44` : "none",
                  opacity: reminderSaving ? 0.6 : 1, flexShrink: 0,
                } as React.CSSProperties}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 4,
                  left: reminderHour !== null ? 28 : 4,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </button>
            </div>
            {reminderHour !== null && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 } as React.CSSProperties}>
                {Array.from({ length: 17 }, (_, i) => i + 6).map(h => (
                  <button key={h} onClick={() => saveReminder(h)}
                    style={{
                      padding: "8px 14px", borderRadius: 10,
                      border: reminderHour === h ? `1.5px solid ${ACCENT}` : "1px solid #1a1a2e",
                      background: reminderHour === h ? `${ACCENT}18` : "#09090b",
                      color: reminderHour === h ? "#fff" : "#6b7280",
                      fontSize: 13, fontWeight: reminderHour === h ? 700 : 400,
                      cursor: "pointer",
                    }}>
                    {h}h
                  </button>
                ))}
              </div>
            )}
          </div>

          {completed.length === 0 && (
            <p style={{ fontSize: 14, color: "#374151", marginTop: 20 }}>Complète ta première séance pour voir tes stats.</p>
          )}
        </div>
      </div>
    </div>
  );
}
