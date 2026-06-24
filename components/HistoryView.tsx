"use client";
import { useState } from "react";
import { DAY_LABEL, localDate, DayType } from "@/lib/program";
import { Session } from "@/lib/types";

const ACCENT = "#0041C2";

export function HistoryView({ sessions }: { sessions: Session[] }) {
  const [showAll, setShowAll] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7;

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
      <div style={{ position: "relative" }}>
        {/* Radial glow */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${ACCENT}12 0%, transparent 65%)`,
        }} />

        <div style={{
          maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1,
          padding: "20px 20px max(32px, calc(env(safe-area-inset-bottom) + 20px))",
        }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p className="font-racing" style={{
              fontSize: 38, fontWeight: 900, fontStyle: "italic", color: "#fff",
              lineHeight: 1, letterSpacing: "-0.02em",
            }}>
              {completed.length}
            </p>
            <p style={{ fontSize: 12, color: "#374151", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              séance{completed.length !== 1 ? "s" : ""} complétée{completed.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Calendar card */}
          <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 22, padding: "18px 16px", marginBottom: 24 }}>
            {/* Month nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => goMonth(-1)}
                style={{ background: "none", border: "none", color: "#6b7280", fontSize: 26, cursor: "pointer", padding: "0 8px", lineHeight: 1 }}>
                ‹
              </button>
              <span className="font-racing" style={{ fontSize: 18, fontWeight: 700, fontStyle: "italic", color: "#fff", textTransform: "capitalize" }}>
                {monthLabel}
              </span>
              <button onClick={() => goMonth(1)}
                style={{ background: "none", border: "none", color: "#6b7280", fontSize: 26, cursor: "pointer", padding: "0 8px", lineHeight: 1 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
              {cells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} style={{ aspectRatio: "1" }} />;

                const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const session = sessionMap.get(dateStr);
                const isToday = dateStr === todayStr;
                const info = session ? DAY_LABEL[session.day_type as DayType] : null;
                const c = info?.color;
                const isFuture = dateStr > todayStr;

                return (
                  <div key={day} style={{
                    aspectRatio: "1", borderRadius: 9,
                    background: c ? c + "30" : isToday ? ACCENT + "18" : "#0d0d18",
                    border: isToday ? `1.5px solid ${ACCENT}88` : c ? `1.5px solid ${c}66` : "1px solid #1a1a2e",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 1,
                    boxShadow: c ? `0 0 10px ${c}33` : "none",
                    position: "relative", overflow: "hidden",
                  }}>
                    {c && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: c, opacity: 0.8 }} />}
                    <span style={{
                      fontSize: 12, lineHeight: 1,
                      fontWeight: c ? 700 : isToday ? 700 : 400,
                      color: c ? "#fff" : isToday ? ACCENT : isFuture ? "#2a2a3e" : "#6b7280",
                    }}>
                      {day}
                    </span>
                    {c && (
                      <span style={{ fontSize: 7, color: c, fontWeight: 800, letterSpacing: "0.02em", lineHeight: 1, marginBottom: 4 }}>
                        {info!.label.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            {seenTypes.size > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid #1a1a2e" }}>
                {Object.entries(DAY_LABEL).map(([type, info]) => {
                  if (!seenTypes.has(type)) return null;
                  return (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: info.color, boxShadow: `0 0 6px ${info.color}88` }} />
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
            <>
            <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 22, overflow: "hidden" }}>
              {(showAll ? completed : completed.slice(0, 20)).map((s, i, arr) => {
                const info = DAY_LABEL[s.day_type as DayType];
                const d = new Date(s.date + "T12:00:00");
                const dateLabel = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
                const accentColor = info?.color ?? ACCENT;
                return (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px",
                    borderBottom: i < arr.length - 1 ? "1px solid #0d0d1a" : "none",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: accentColor + "18",
                      border: `1px solid ${accentColor}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 10px ${accentColor}22`,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-racing" style={{ fontSize: 16, fontWeight: 700, fontStyle: "italic", color: "#fff", letterSpacing: "-0.01em" }}>
                        {info?.label ?? s.day_type}
                      </p>
                      <p style={{ fontSize: 12, color: "#374151", marginTop: 2, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dateLabel}
                      </p>
                    </div>
                    {s.duration_seconds != null && s.duration_seconds > 0 && (
                      <span className="font-racing" style={{ fontSize: 15, fontWeight: 700, color: "#374151", flexShrink: 0 }}>
                        {Math.round(s.duration_seconds / 60)}<span style={{ fontSize: 11 }}>min</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {completed.length > 20 && (
              <button onClick={() => setShowAll(v => !v)}
                style={{ width: "100%", marginTop: 10, padding: "13px 0", borderRadius: 16, border: "1px solid #1a1a2e", background: "transparent", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {showAll ? "Voir moins" : `Voir plus (${completed.length - 20} de plus)`}
              </button>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
