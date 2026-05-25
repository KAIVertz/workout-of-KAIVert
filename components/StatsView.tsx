"use client";
import { useEffect, useState } from "react";
import { DAY_LABEL, PROGRAM, localDate, DayType } from "@/lib/program";

interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }
interface PR { exercise_name: string; max_weight: number; best_reps: number; }

export function StatsView({ sessions }: { sessions: Session[] }) {
  const [prs, setPrs] = useState<PR[]>([]);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => { if (d.records) setPrs(d.records); }).catch(() => {});
  }, []);

  const completed = sessions.filter(s => s.completed);
  const today = new Date();

  // Last 8 weeks volume
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    const mondayOffset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - mondayOffset - (7 - i - 1) * 7);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setDate(d.getDate() + 7);
    const label = i === 7 ? "Auj." : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const count = completed.filter(s => {
      const sd = new Date(s.date + "T12:00:00");
      return sd >= d && sd < end;
    }).length;
    return { label, count, isCurrent: i === 7 };
  });

  const maxCount = Math.max(...weeks.map(w => w.count), 1);

  // Muscle frequency this month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthSessions = completed.filter(s => new Date(s.date + "T12:00:00") >= monthStart);

  const muscleCounts: Record<string, { count: number; color: string }> = {};
  monthSessions.forEach(s => {
    const info = DAY_LABEL[s.day_type as DayType];
    const exs = PROGRAM[s.day_type as DayType] ?? [];
    const muscles = [...new Set(exs.map(e => e.muscle))];
    muscles.forEach(m => {
      if (!muscleCounts[m]) muscleCounts[m] = { count: 0, color: info?.color ?? "#0041C2" };
      muscleCounts[m].count++;
    });
  });

  const sortedMuscles = Object.entries(muscleCounts).sort((a, b) => b[1].count - a[1].count);
  const maxMuscle = sortedMuscles[0]?.[1].count ?? 1;

  // Total stats
  const totalSessions = completed.length;
  const totalMin = Math.round(completed.reduce((a, s) => a + (s.duration_seconds ?? 0), 0) / 60);
  const thisWeekCount = weeks[7].count;
  const lastWeekCount = weeks[6].count;

  return (
    <div style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <div style={{
        maxWidth: 480, margin: "0 auto",
        padding: "20px 20px max(32px, calc(env(safe-area-inset-bottom) + 20px))",
      }}>

        {/* Top stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 16, padding: "16px" }}>
            <p style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Total</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{totalSessions}</p>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>séances</p>
          </div>
          <div style={{ flex: 1, background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 16, padding: "16px" }}>
            <p style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Temps total</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{totalMin < 60 ? totalMin : Math.round(totalMin / 60)}</p>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{totalMin < 60 ? "min" : "heures"}</p>
          </div>
          <div style={{ flex: 1, background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 16, padding: "16px" }}>
            <p style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Cette sem.</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{thisWeekCount}</p>
            <p style={{ fontSize: 11, color: thisWeekCount >= lastWeekCount ? "#059669" : "#6b7280", marginTop: 4 }}>
              {lastWeekCount > 0 ? (thisWeekCount >= lastWeekCount ? `+${thisWeekCount - lastWeekCount} vs S-1` : `${thisWeekCount - lastWeekCount} vs S-1`) : "séances"}
            </p>
          </div>
        </div>

        {/* Volume chart */}
        <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          Séances · 8 semaines
        </p>
        <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20, padding: "20px 16px 14px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 88 }}>
            {weeks.map((w, i) => {
              const barH = w.count > 0 ? Math.max((w.count / maxCount) * 72, 10) : 0;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
                  {w.count > 0 && (
                    <span style={{ fontSize: 10, color: w.isCurrent ? "#fff" : "#6b7280", fontWeight: w.isCurrent ? 700 : 400 }}>{w.count}</span>
                  )}
                  <div style={{
                    width: "100%",
                    height: barH || 3,
                    borderRadius: 5,
                    background: w.isCurrent ? "#0041C2" : w.count > 0 ? "#0041C244" : "#1a1a2e",
                    transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: 9, color: w.isCurrent ? "#6b7280" : "#374151", display: "block" }}>
                  {w.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Muscle frequency */}
        <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          Muscles · Ce mois
        </p>
        <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20, padding: "16px 20px", marginBottom: 20 }}>
          {sortedMuscles.length === 0 ? (
            <p style={{ fontSize: 13, color: "#374151" }}>Aucune séance ce mois.</p>
          ) : sortedMuscles.map(([muscle, { count, color }], i) => (
            <div key={muscle} style={{ marginBottom: i < sortedMuscles.length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{muscle}</span>
                <span style={{ fontSize: 11, color: "#374151" }}>{count}×</span>
              </div>
              <div style={{ height: 5, background: "#1a1a2e", borderRadius: 3 }}>
                <div style={{
                  height: "100%",
                  width: `${(count / maxMuscle) * 100}%`,
                  background: color, borderRadius: 3,
                  transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Personal records */}
        {prs.length > 0 && (
          <>
            <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
              Records personnels
            </p>
            <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20, overflow: "hidden" }}>
              {prs.map((pr, i) => (
                <div key={pr.exercise_name} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 20px",
                  borderBottom: i < prs.length - 1 ? "1px solid #1a1a2e" : "none",
                }}>
                  <span style={{ fontSize: 13, color: "#d1d5db", flex: 1, marginRight: 12 }}>{pr.exercise_name}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, color: "#0041C2", fontWeight: 700 }}>{pr.max_weight} kg</span>
                    <span style={{ fontSize: 11, color: "#374151" }}>× {pr.best_reps}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {completed.length === 0 && (
          <p style={{ fontSize: 14, color: "#374151", marginTop: 20 }}>
            Complète ta première séance pour voir tes stats.
          </p>
        )}
      </div>
    </div>
  );
}
