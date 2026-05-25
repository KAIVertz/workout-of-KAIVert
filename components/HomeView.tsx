"use client";
import { DAY_LABEL, PROGRAM, WEEKLY_SCHEDULE, localDate, computeStreak, DayType } from "@/lib/program";

interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }

interface Props {
  sessions: Session[];
  onStart: () => void;
  starting: boolean;
  onCheckin: () => void;
  dayType: DayType;
}

function ProgressRing({ done, total, color }: { done: number; total: number; color: string }) {
  const R = 34;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - (total > 0 ? Math.min(done / total, 1) : 0));
  return (
    <svg width={84} height={84} viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
      <circle cx="42" cy="42" r={R} fill="none" stroke="#1a1a2e" strokeWidth={7} />
      <circle cx="42" cy="42" r={R} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 42 42)"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x="42" y="37" textAnchor="middle" fill="#ffffff" fontSize="19" fontWeight="900" fontFamily="system-ui,-apple-system,sans-serif">{done}</text>
      <text x="42" y="53" textAnchor="middle" fill="#374151" fontSize="11" fontFamily="system-ui,-apple-system,sans-serif">/{total}</text>
    </svg>
  );
}

export function HomeView({ sessions, onStart, starting, onCheckin, dayType }: Props) {
  const { label, sub, color } = DAY_LABEL[dayType];
  const exercises = PROGRAM[dayType];
  const streak = computeStreak(sessions);

  const today = new Date();
  const todayDow = today.getDay();
  const mondayOffset = (todayDow + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekSessions = sessions.filter(s => {
    if (!s.completed) return false;
    const d = new Date(s.date + "T12:00:00");
    return d >= monday;
  });

  const daysElapsedThisWeek = mondayOffset + 1;
  const possibleWorkoutDays = Math.min(daysElapsedThisWeek, 6);

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
      <div style={{
        maxWidth: 480, margin: "0 auto",
        padding: "20px 20px max(32px, calc(env(safe-area-inset-bottom) + 20px))",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "#374151", textTransform: "capitalize" }}>{dateLabel}</p>
          <button onClick={onCheckin} style={{
            background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 10,
            padding: "7px 12px", color: "#6b7280", fontSize: 12, cursor: "pointer",
          }}>
            Check-in
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {/* Progress ring card */}
          <div style={{
            flex: 1, background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20,
            padding: "18px 18px", display: "flex", alignItems: "center", gap: 14,
          }}>
            <ProgressRing done={weekSessions.length} total={possibleWorkoutDays} color={color} />
            <div>
              <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Cette semaine</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{weekSessions.length}</p>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {weekSessions.length === 1 ? "séance" : "séances"}
              </p>
            </div>
          </div>

          {/* Streak card */}
          <div style={{
            width: 96, background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            padding: "18px 12px",
          }}>
            <p style={{ fontSize: 40, fontWeight: 900, color: streak > 0 ? "#fff" : "#1a1a2e", lineHeight: 1, letterSpacing: "-0.03em" }}>{streak}</p>
            <p style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>
              {streak === 1 ? "jour" : "jours"}
            </p>
          </div>
        </div>

        {/* Week strip */}
        <div style={{
          background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 16,
          padding: "14px 16px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              const dateStr = localDate(d);
              const sessionColor = sessionDateMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const isFuture = d > today;

              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 10, color: isToday ? "#fff" : "#374151", fontWeight: isToday ? 700 : 400 }}>
                    {DAY_LETTERS[i]}
                  </span>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: sessionColor ? sessionColor + "22" : isFuture ? "transparent" : "#0a0a12",
                    border: isToday ? `1.5px solid ${color}` : sessionColor ? `1px solid ${sessionColor}55` : "1px solid #1a1a2e",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {sessionColor && <div style={{ width: 8, height: 8, borderRadius: "50%", background: sessionColor }} />}
                    {isToday && !sessionColor && <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, opacity: 0.7 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's workout card */}
        <div style={{
          background: "#10101a", border: `1px solid ${color}28`,
          borderTop: `2px solid ${color}`, borderRadius: 20,
          overflow: "hidden", marginBottom: 16,
        }}>
          <div style={{ padding: "18px 20px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{label}</p>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{sub}</p>
              </div>
              <span style={{ fontSize: 12, color: "#374151" }}>{exercises.reduce((a, e) => a + e.sets, 0)} séries</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1a1a2e" }}>
            {exercises.map((ex, i) => (
              <div key={ex.name} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 20px",
                borderBottom: i < exercises.length - 1 ? "1px solid #1a1a2e" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "#d1d5db" }}>{ex.name}</span>
                </div>
                <span style={{ fontSize: 12, color: "#374151", fontVariantNumeric: "tabular-nums" }}>
                  {ex.sets}×{ex.reps}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button onClick={onStart} disabled={starting}
          style={{
            width: "100%", padding: "19px 0", borderRadius: 18, border: "none",
            background: color, color: "#fff",
            fontSize: 15, fontWeight: 800, letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: starting ? "wait" : "pointer",
            opacity: starting ? 0.7 : 1, transition: "opacity 0.15s",
          }}>
          {starting ? "Démarrage…" : "Commencer"}
        </button>
      </div>
    </div>
  );
}
