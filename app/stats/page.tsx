"use client";

import { useEffect, useState } from "react";
import { PROGRAM, DayType } from "@/lib/program";
import { BottomNav } from "@/components/BottomNav";

interface Session {
  id: number;
  date: string;
  day_type: DayType;
  completed: boolean;
}

interface ProgressRow {
  date: string;
  day_type: DayType;
  exercise_name: string;
  max_weight: number;
  max_reps: number;
}

const ACCENT: Record<DayType, { text: string; dim: string; color: string }> = {
  push: { text: "text-orange-400", dim: "text-orange-900", color: "#f97316" },
  pull: { text: "text-blue-400", dim: "text-blue-900", color: "#3b82f6" },
  legs: { text: "text-green-400", dim: "text-green-900", color: "#22c55e" },
};

const KEY_EXERCISES: { name: string; day: DayType }[] = [
  { name: "Floor DB Press", day: "push" },
  { name: "DB Shoulder Press", day: "push" },
  { name: "DB Bent-over Row", day: "pull" },
  { name: "DB Bicep Curl", day: "pull" },
  { name: "DB Goblet Squat", day: "legs" },
  { name: "DB Romanian Deadlift", day: "legs" },
];

// ─── Streak computation ───────────────────────────────────────────────────────
function computeStreaks(sessions: Session[]): { current: number; best: number } {
  const completedDates = new Set(
    sessions.filter((s) => s.completed).map((s) => s.date)
  );
  if (completedDates.size === 0) return { current: 0, best: 0 };

  // Current streak (going back from today, skipping Sundays)
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  let current = completedDates.has(todayStr) ? 1 : 0;
  const d = new Date(today);
  d.setDate(d.getDate() - (completedDates.has(todayStr) ? 1 : 0));
  // Walk back until we find a gap
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (d.getDay() === 0) { d.setDate(d.getDate() - 1); continue; } // skip Sunday
    const str = d.toISOString().split("T")[0];
    if (completedDates.has(str)) { current++; d.setDate(d.getDate() - 1); }
    else break;
  }

  // Best streak (scan full history)
  const sorted = Array.from(completedDates).sort();
  let best = 0;
  let run = 0;
  const scan = new Date(sorted[0]);
  const last = new Date(sorted[sorted.length - 1]);
  while (scan <= last) {
    if (scan.getDay() === 0) { scan.setDate(scan.getDate() + 1); continue; }
    const str = scan.toISOString().split("T")[0];
    if (completedDates.has(str)) { run++; best = Math.max(best, run); }
    else run = 0;
    scan.setDate(scan.getDate() + 1);
  }

  return { current, best: Math.max(best, current) };
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────
function getWeeks(weeksBack: number): Date[][] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  // Start of this week (Monday)
  const startOfWeek = new Date(today);
  const dow = today.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  startOfWeek.setDate(today.getDate() + diffToMon);

  const weeks: Date[][] = [];
  for (let w = weeksBack - 1; w >= 0; w--) {
    const week: Date[] = [];
    for (let d = 0; d < 6; d++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() - w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }
  return weeks;
}

// ─── Sparkline SVG ───────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 120;
  const H = 36;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = W;
  const lastY = H - ((data[data.length - 1] - min) / range) * (H - 4) - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

// ─── Coach message ────────────────────────────────────────────────────────────
function coachMessage(sessions: Session[], streak: number): string {
  const today = new Date();
  if (today.getDay() === 0) return "Sunday. No weights today. Sleep, eat, recover.";
  const last = sessions.find((s) => s.completed);
  if (!last) return "No history yet. Day one starts now.";
  const diff = Math.floor(
    (Date.now() - new Date(last.date).getTime()) / 86400000
  );
  if (diff === 0) return "Session done. Protein in. Recovery starts now.";
  if (streak >= 5) return `${streak}-day streak. You're in the zone. Don't stop.`;
  if (streak >= 3) return `${streak} days straight. The body is adapting.`;
  if (diff === 1) return "24h recovery complete. Body is primed. Let's go.";
  if (diff === 2) return "2 days off. Muscles rebuilt. Ready to hit harder.";
  return `${diff} days off. Don't let it become a habit.`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StatsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessRes, progRes] = await Promise.all([
          fetch("/api/sessions"),
          fetch("/api/progress"),
        ]);
        const sessData = await sessRes.json();
        const progData = await progRes.json();
        setSessions(Array.isArray(sessData) ? sessData : []);
        setProgress(Array.isArray(progData) ? progData : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completed = sessions.filter((s) => s.completed);
  const { current: streak, best: bestStreak } = computeStreaks(sessions);
  const weeks = getWeeks(5);
  const completedDateSet = new Map<string, DayType>();
  for (const s of completed) completedDateSet.set(s.date, s.day_type);

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Weekly volume (this week)
  const weekStart = new Date(weeks[weeks.length - 1][0]);
  weekStart.setHours(0, 0, 0, 0);
  const thisWeekWorkouts = completed.filter((s) => new Date(s.date) >= weekStart).length;

  const DAY_LABELS = ["M", "T", "W", "T", "F", "S"];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] font-bold tracking-widest text-sm uppercase animate-pulse">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-36">
      {/* Header */}
      <div className="px-4 pt-14 pb-5 border-b border-[#1a1a1a]">
        <div className="max-w-md mx-auto">
          <p className="text-[#555] text-xs font-semibold uppercase tracking-widest mb-2">
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Dashboard</h1>
          <p className="text-[#555] text-sm mt-2 font-medium italic">
            &ldquo;{coachMessage(sessions, streak)}&rdquo;
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-6">

        {/* ── KPI row ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "STREAK", value: streak, unit: streak === 1 ? "day" : "days", highlight: streak > 0 },
            { label: "BEST", value: bestStreak, unit: bestStreak === 1 ? "day" : "days", highlight: false },
            { label: "TOTAL", value: completed.length, unit: "sessions", highlight: false },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-3 text-center">
              <p className="text-[#555] text-[9px] font-black uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className={`font-black leading-none ${kpi.highlight && streak > 0 ? "text-orange-400" : "text-white"}`}
                style={{ fontSize: kpi.value > 99 ? "1.5rem" : "2rem" }}>
                {kpi.value}
              </p>
              <p className="text-[#444] text-[9px] font-semibold mt-0.5 uppercase">{kpi.unit}</p>
            </div>
          ))}
        </div>

        {/* ── This week ────────────────────────────── */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#555] text-[10px] font-black uppercase tracking-widest">This Week</p>
            <p className="text-[#555] text-[10px] font-bold">{thisWeekWorkouts} / 6 sessions</p>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {weeks[weeks.length - 1].map((day, i) => {
              const str = day.toISOString().split("T")[0];
              const dt = completedDateSet.get(str);
              const isToday = str === todayStr;
              const isPast = day < today;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <p className="text-[#444] text-[9px] font-bold uppercase">{DAY_LABELS[i]}</p>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                      dt
                        ? `border-transparent`
                        : isToday
                        ? "border-white/20 bg-[#1a1a1a]"
                        : isPast
                        ? "border-[#1f1f1f] bg-[#0f0f0f]"
                        : "border-[#1a1a1a] bg-[#111]"
                    }`}
                    style={dt ? { background: ACCENT[dt].color + "22", borderColor: ACCENT[dt].color + "44" } : undefined}
                  >
                    {dt ? (
                      <span className="text-[10px] font-black" style={{ color: ACCENT[dt].color }}>
                        {PROGRAM[dt].label[0]}
                      </span>
                    ) : isPast ? (
                      <span className="text-[#2a2a2a] text-[10px]">—</span>
                    ) : (
                      <span className="text-[#2a2a2a] text-[10px]">·</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Calendar (last 5 weeks) ───────────────── */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-4">
          <p className="text-[#555] text-[10px] font-black uppercase tracking-widest mb-3">Activity</p>
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-6 gap-1.5">
                {week.map((day, di) => {
                  const str = day.toISOString().split("T")[0];
                  const dt = completedDateSet.get(str);
                  const isFuture = day > today;
                  return (
                    <div
                      key={di}
                      className="h-6 rounded-lg flex items-center justify-center"
                      style={
                        dt
                          ? { background: ACCENT[dt].color + "33", border: `1px solid ${ACCENT[dt].color}55` }
                          : { background: isFuture ? "transparent" : "#111", border: "1px solid #1a1a1a" }
                      }
                    >
                      {dt && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT[dt].color }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-3">
            {(["push", "pull", "legs"] as DayType[]).map((d) => (
              <div key={d} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: ACCENT[d].color }} />
                <span className="text-[#555] text-[9px] font-bold uppercase">{PROGRAM[d].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Workout breakdown ─────────────────────── */}
        {completed.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {(["push", "pull", "legs"] as DayType[]).map((d) => {
              const count = completed.filter((s) => s.day_type === d).length;
              return (
                <div key={d} className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-3 text-center">
                  <p className="font-black text-2xl" style={{ color: ACCENT[d].color }}>{count}</p>
                  <p className="text-[#555] text-[9px] font-black uppercase tracking-widest mt-0.5">
                    {PROGRAM[d].label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Lift progression ─────────────────────── */}
        {completed.length > 0 && (
          <div>
            <p className="text-[#555] text-[10px] font-black uppercase tracking-widest mb-3">
              Lift Progression
            </p>
            <div className="space-y-2">
              {KEY_EXERCISES.map(({ name, day }) => {
                const rows = progress
                  .filter((r) => r.exercise_name === name)
                  .sort((a, b) => a.date.localeCompare(b.date));

                if (rows.length === 0) return null;

                const weights = rows.map((r) => Number(r.max_weight));
                const first = weights[0];
                const last = weights[weights.length - 1];
                const pctChange = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
                const a = ACCENT[day];

                return (
                  <div key={name} className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-bold text-sm">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${a.text}`}>
                            {PROGRAM[day].label}
                          </span>
                          <span className="text-[#333]">·</span>
                          <span className="text-[#555] text-[10px] font-mono">{rows.length} sessions</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white font-mono text-lg leading-none">{last}kg</p>
                        {pctChange !== 0 && (
                          <p className={`text-xs font-bold mt-0.5 ${pctChange > 0 ? "text-green-400" : "text-red-400"}`}>
                            {pctChange > 0 ? "▲" : "▼"} {Math.abs(pctChange)}%
                          </p>
                        )}
                        {pctChange === 0 && rows.length > 1 && (
                          <p className="text-[#555] text-xs font-bold mt-0.5">→ stable</p>
                        )}
                      </div>
                    </div>
                    <Sparkline data={weights} color={a.color} />
                    {weights.length === 1 && (
                      <p className="text-[#444] text-[10px] mt-1">Complete more sessions to see trend</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completed.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-white font-black text-xl uppercase">No data yet</p>
            <p className="text-[#555] text-sm mt-2">Complete workouts to see your stats.</p>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
