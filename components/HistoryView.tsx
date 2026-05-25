"use client";
import { useState } from "react";
import { DAY_LABEL, localDate, DayType } from "@/lib/program";

interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }

export function HistoryView({ sessions }: { sessions: Session[] }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0

  const completed = sessions.filter(s => s.completed);
  const sessionMap = new Map<string, Session>();
  completed.forEach(s => sessionMap.set(s.date, s));

  const todayStr = localDate();
  const monthLabel = firstDay.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function goMonth(delta: number) {
    setViewMonth(m => {
      const d = new Date(m.year, m.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const seenTypes = new Set(completed.map(s => s.day_type));

  return (
    <div style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <div style={{
        maxWidth: 480, margin: "0 auto",
        padding: "max(52px, calc(env(safe-area-inset-top) + 20px)) 20px max(88px, calc(env(safe-area-inset-bottom) + 76px))",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>
            Historique
          </p>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            {completed.length} séance{completed.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {/* Calendar card */}
        <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20, padding: "18px 16px", marginBottom: 24 }}>
          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button onClick={() => goMonth(-1)}
              style={{ background: "none", border: "none", color: "#6b7280", fontSize: 24, cursor: "pointer", padding: "0 10px", lineHeight: 1, letterSpacing: "-0.05em" }}>
              ‹
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "capitalize" }}>
              {monthLabel}
            </span>
            <button onClick={() => goMonth(1)}
              style={{ background: "none", border: "none", color: "#6b7280", fontSize: 24, cursor: "pointer", padding: "0 10px", lineHeight: 1, letterSpacing: "-0.05em" }}>
              ›
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#374151", paddingBottom: 6 }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} style={{ aspectRatio: "1" }} />;

              const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const session = sessionMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const info = session ? DAY_LABEL[session.day_type as DayType] : null;
              const c = info?.color;

              return (
                <div key={day} style={{
                  aspectRatio: "1", borderRadius: 7,
                  background: c ? c + "22" : "#0a0a12",
                  border: isToday ? "1.5px solid #0041C2" : c ? `1px solid ${c}44` : "1px solid #141420",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                }}>
                  <span style={{ fontSize: 11, fontWeight: session ? 600 : 400, color: c ? "#fff" : isToday ? "#0041C2" : "#374151" }}>
                    {day}
                  </span>
                  {c && <div style={{ width: 3, height: 3, borderRadius: "50%", background: c }} />}
                </div>
              );
            })}
          </div>

          {/* Legend — only types that have sessions */}
          {seenTypes.size > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #1a1a2e" }}>
              {Object.entries(DAY_LABEL).map(([type, info]) => {
                if (!seenTypes.has(type)) return null;
                return (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: info.color }} />
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{info.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent sessions list */}
        <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
          Séances récentes
        </p>

        {completed.length === 0 ? (
          <p style={{ fontSize: 14, color: "#374151" }}>Aucune séance complétée.</p>
        ) : (
          <div>
            {completed.slice(0, 20).map((s, i) => {
              const info = DAY_LABEL[s.day_type as DayType];
              const d = new Date(s.date + "T12:00:00");
              const dateLabel = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
              const accentColor = info?.color ?? "#0041C2";
              return (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 0",
                  borderBottom: i < Math.min(completed.length, 20) - 1 ? "1px solid #1a1a2e" : "none",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: accentColor + "18",
                    border: `1px solid ${accentColor}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: accentColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{info?.label ?? s.day_type}</p>
                    <p style={{ fontSize: 12, color: "#374151", marginTop: 2, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {dateLabel}
                    </p>
                  </div>
                  {s.duration_seconds != null && s.duration_seconds > 0 && (
                    <span style={{ fontSize: 12, color: "#374151", flexShrink: 0 }}>
                      {Math.round(s.duration_seconds / 60)}min
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
