"use client";

import { useEffect, useState } from "react";
import { PROGRAM, ACCENT, DayType, WEEKLY_SCHEDULE } from "@/lib/program";
import { BottomNav } from "@/components/BottomNav";

interface Session {
  id: number;
  date: string;
  day_type: DayType;
  completed: boolean;
  duration_seconds?: number;
}

interface ProgressRow {
  date: string;
  day_type: DayType;
  exercise_name: string;
  max_weight: number;
  max_reps: number;
}

const KEY_EXERCISES: { name: string; day: DayType }[] = [
  { name: "DB Floor Press",          day: "push"  },
  { name: "DB Shoulder Press",       day: "push"  },
  { name: "DB Bent-over Row",        day: "pull"  },
  { name: "DB Bicep Curl",           day: "pull"  },
  { name: "DB Goblet Squat",         day: "legs"  },
  { name: "DB Romanian Deadlift",    day: "legs"  },
  { name: "DB Hammer Curl",          day: "arms"  },
  { name: "DB Close-Grip Floor Press", day: "arms"},
  { name: "DB Floor Fly",            day: "chest" },
];

const ALL_DAYS = Object.values(WEEKLY_SCHEDULE).filter(Boolean) as DayType[];

// ─── Streak ────────────────────────────────────────────────────────────────────
function computeStreaks(sessions: Session[]): { current: number; best: number } {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (!dates.size) return { current: 0, best: 0 };
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  let current = dates.has(todayStr) ? 1 : 0;
  const d = new Date(today);
  d.setDate(d.getDate() - (dates.has(todayStr) ? 1 : 0));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (d.getDay() === 0) { d.setDate(d.getDate() - 1); continue; }
    if (dates.has(d.toISOString().split("T")[0])) { current++; d.setDate(d.getDate() - 1); }
    else break;
  }
  let best = 0, run = 0;
  const sorted = Array.from(dates).sort();
  const scan = new Date(sorted[0]);
  const last = new Date(sorted[sorted.length - 1]);
  while (scan <= last) {
    if (scan.getDay() === 0) { scan.setDate(scan.getDate() + 1); continue; }
    const str = scan.toISOString().split("T")[0];
    if (dates.has(str)) { run++; best = Math.max(best, run); } else run = 0;
    scan.setDate(scan.getDate() + 1);
  }
  return { current, best: Math.max(best, current) };
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function getWeeks(n: number): Date[][] {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
  return Array.from({ length: n }, (_, wi) =>
    Array.from({ length: 6 }, (__, di) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() - (n - 1 - wi) * 7 + di);
      return d;
    })
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const W = 120, H = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lx = W, ly = H - ((data[data.length - 1] - min) / range) * (H - 4) - 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
}

// ─── Coach message ─────────────────────────────────────────────────────────────
function coachLine(sessions: Session[], streak: number): string {
  if (new Date().getDay() === 0) return "Sunday — rest and recover.";
  const last = sessions.find((s) => s.completed);
  if (!last) return "No data yet. Start your first session.";
  const diff = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  if (diff === 0) return "Session done. Protein in. Recovery starts now.";
  if (streak >= 5) return `${streak}-day streak. You're building something real.`;
  if (streak >= 3) return `${streak} days straight. Body is adapting.`;
  if (diff === 1) return "24h recovery complete. You're ready.";
  return `${diff} days off. Don't let it become a habit.`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, pRes] = await Promise.all([fetch("/api/sessions"), fetch("/api/progress")]);
        const [sData, pData] = await Promise.all([sRes.json(), pRes.json()]);
        setSessions(Array.isArray(sData) ? sData : []);
        setProgress(Array.isArray(pData) ? pData : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completed = sessions.filter((s) => s.completed);
  const { current: streak, best: bestStreak } = computeStreaks(sessions);
  const weeks = getWeeks(5);
  const completedMap = new Map(completed.map((s) => [s.date, s.day_type]));

  const today = new Date(); today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // This week volume per day (Mon=0..Sat=5)
  const thisWeek = weeks[weeks.length - 1];
  const weekVolume: number[] = thisWeek.map((day) => {
    const str = day.toISOString().split("T")[0];
    const sess = completed.find((s) => s.date === str);
    if (!sess) return 0;
    const dayProgress = progress.filter((r) => r.date === str);
    return dayProgress.reduce((acc, r) => acc + Number(r.max_weight), 0);
  });
  const maxVol = Math.max(...weekVolume, 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-[#444] text-sm font-bold tracking-widest uppercase animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-36">
      <div className="h-0.5 bg-[#1a1a1a]" />

      {/* Header */}
      <div className="px-4 pt-10 pb-5 border-b border-[#141414]">
        <div className="max-w-md mx-auto">
          <p className="text-[#444] text-[10px] font-bold uppercase tracking-widest mb-1">
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Dashboard</h1>
          <p className="text-[#444] text-xs italic mt-1.5">&ldquo;{coachLine(sessions, streak)}&rdquo;</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "STREAK", value: streak, unit: "days", hot: streak > 0 },
            { label: "BEST",   value: bestStreak, unit: "days", hot: false },
            { label: "TOTAL",  value: completed.length, unit: "sessions", hot: false },
          ].map((k) => (
            <div key={k.label} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black text-[#444] uppercase tracking-widest mb-1">{k.label}</p>
              <p className="font-black leading-none text-white" style={{ fontSize: k.value > 99 ? "1.5rem" : "2rem", color: k.hot && k.value > 0 ? "#f97316" : undefined }}>
                {k.value}
              </p>
              <p className="text-[8px] text-[#333] uppercase mt-0.5">{k.unit}</p>
            </div>
          ))}
        </div>

        {/* Weekly volume bar chart */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-[#444] uppercase tracking-widest">Weekly Volume</p>
            <p className="text-[10px] text-[#333] font-mono">
              {weekVolume.reduce((a, b) => a + b, 0).toLocaleString()}kg total
            </p>
          </div>
          <div className="flex items-end gap-2 h-16">
            {thisWeek.map((day, i) => {
              const str = day.toISOString().split("T")[0];
              const dt = completedMap.get(str);
              const vol = weekVolume[i];
              const h = vol > 0 ? Math.max(8, (vol / maxVol) * 56) : 4;
              const isToday = str === todayStr;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-lg transition-all"
                    style={{
                      height: h,
                      background: dt ? ACCENT[dt].color : isToday ? "#222" : "#1a1a1a",
                      opacity: vol === 0 ? 0.4 : 1,
                    }}
                  />
                  <p className="text-[8px] font-bold text-[#333] uppercase">
                    {["M","T","W","T","F","S"][i]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity calendar */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
          <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-3">Activity</p>
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-6 gap-1.5">
                {week.map((day, di) => {
                  const str = day.toISOString().split("T")[0];
                  const dt = completedMap.get(str);
                  const isFuture = day > today;
                  return (
                    <div
                      key={di}
                      className="h-6 rounded-lg"
                      style={
                        dt
                          ? { background: ACCENT[dt].color + "30", border: `1px solid ${ACCENT[dt].color}50` }
                          : { background: isFuture ? "transparent" : "#0a0a0a", border: "1px solid #1a1a1a" }
                      }
                    >
                      {dt && <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT[dt].color }} />
                      </div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {ALL_DAYS.map((d) => (
              <div key={d} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: ACCENT[d].color }} />
                <span className="text-[8px] font-bold text-[#444] uppercase">{ACCENT[d].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day breakdown */}
        {completed.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {ALL_DAYS.map((d) => {
              const count = completed.filter((s) => s.day_type === d).length;
              return (
                <div key={d} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 text-center">
                  <p className="font-black text-xl" style={{ color: ACCENT[d].color }}>{count}</p>
                  <p className="text-[8px] font-black text-[#444] uppercase tracking-widest mt-0.5">{ACCENT[d].label}</p>
                  <p className="text-[7px] text-[#333] mt-0.5 truncate">{ACCENT[d].sub.split(" · ")[0]}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Lift progression */}
        {completed.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-3">Lift Progression</p>
            <div className="space-y-2">
              {KEY_EXERCISES.map(({ name, day }) => {
                const rows = progress.filter((r) => r.exercise_name === name).sort((a, b) => a.date.localeCompare(b.date));
                if (!rows.length) return null;
                const weights = rows.map((r) => Number(r.max_weight));
                const first = weights[0], last = weights[weights.length - 1];
                const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
                const a = ACCENT[day];
                return (
                  <div key={name} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-bold text-sm">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: a.color }}>{a.label}</span>
                          <span className="text-[#2a2a2a]">·</span>
                          <span className="text-[#444] text-[9px] font-mono">{rows.length} sessions</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white font-mono text-lg leading-none">{last}kg</p>
                        {pct !== 0 && (
                          <p className={`text-xs font-bold mt-0.5 ${pct > 0 ? "text-green-400" : "text-red-400"}`}>
                            {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%
                          </p>
                        )}
                        {pct === 0 && rows.length > 1 && <p className="text-[#444] text-xs mt-0.5">→ stable</p>}
                      </div>
                    </div>
                    <Sparkline data={weights} color={a.color} />
                    {weights.length === 1 && <p className="text-[#333] text-[9px] mt-1">More sessions needed to show trend</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!completed.length && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-white font-black text-xl uppercase">No data yet</p>
            <p className="text-[#444] text-sm mt-2">Complete sessions to see your stats.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
