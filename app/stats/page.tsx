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

const ALL_DAYS = Object.values(WEEKLY_SCHEDULE).filter(Boolean) as DayType[];

const KEY_EXERCISES = Object.values(PROGRAM).flat().filter(
  (ex, i, arr) => arr.findIndex((e) => e.name === ex.name) === i
).slice(0, 8);

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

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const W = 120, H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lx = W, ly = H - ((data[data.length - 1] - min) / range) * (H - 4) - 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}

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
  const thisWeek = weeks[weeks.length - 1];

  const weekVolume: number[] = thisWeek.map((day) => {
    const str = day.toISOString().split("T")[0];
    const dayProg = progress.filter((r) => r.date === str);
    return dayProg.reduce((acc, r) => acc + Number(r.max_weight), 0);
  });
  const maxVol = Math.max(...weekVolume, 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-[#333] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pb-28">
      <div className="px-5 pt-14 pb-6 border-b border-[#141414]">
        <p className="text-[#444] text-sm mb-1">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-4xl font-bold text-white tracking-tight">Stats</h1>
        <p className="text-[#444] text-sm italic mt-1">{coachLine(sessions, streak)}</p>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 space-y-8">

        {/* KPIs */}
        <div className="flex gap-6">
          {[
            { label: "Streak", value: streak, unit: "days" },
            { label: "Best", value: bestStreak, unit: "days" },
            { label: "Total", value: completed.length, unit: "sessions" },
          ].map((k) => (
            <div key={k.label} className="flex-1">
              <p className="text-[#444] text-xs">{k.label}</p>
              <p className="text-white text-3xl font-bold mt-0.5 tabular-nums">{k.value}</p>
              <p className="text-[#333] text-xs mt-0.5">{k.unit}</p>
            </div>
          ))}
        </div>

        {/* Weekly volume */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#444] text-xs uppercase tracking-widest font-medium">This week</p>
            <p className="text-[#444] text-xs font-mono">{weekVolume.reduce((a, b) => a + b, 0).toLocaleString()}kg</p>
          </div>
          <div className="flex items-end gap-2 h-14">
            {thisWeek.map((day, i) => {
              const str = day.toISOString().split("T")[0];
              const dt = completedMap.get(str);
              const vol = weekVolume[i];
              const h = vol > 0 ? Math.max(6, (vol / maxVol) * 48) : 3;
              const isToday = str === todayStr;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: h,
                      background: dt ? ACCENT[dt].color : isToday ? "#222" : "#161616",
                      opacity: vol === 0 ? 0.5 : 1,
                    }}
                  />
                  <p className="text-[9px] font-medium text-[#333] uppercase">{["M","T","W","T","F","S"][i]}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity calendar */}
        <div>
          <p className="text-[#444] text-xs uppercase tracking-widest font-medium mb-4">Activity</p>
          <div className="space-y-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-6 gap-2">
                {week.map((day, di) => {
                  const str = day.toISOString().split("T")[0];
                  const dt = completedMap.get(str);
                  const isFuture = day > today;
                  return (
                    <div
                      key={di}
                      className="h-7 rounded-lg"
                      style={
                        dt
                          ? { background: ACCENT[dt].color + "25", border: `1px solid ${ACCENT[dt].color}40` }
                          : { background: isFuture ? "transparent" : "#111", border: "1px solid #161616" }
                      }
                    >
                      {dt && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT[dt].color }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {ALL_DAYS.map((d) => (
              <div key={d} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: ACCENT[d].color }} />
                <span className="text-xs text-[#444]">{ACCENT[d].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day breakdown */}
        {completed.length > 0 && (
          <div>
            <p className="text-[#444] text-xs uppercase tracking-widest font-medium mb-4">By type</p>
            <div className="grid grid-cols-3 gap-3">
              {ALL_DAYS.map((d) => {
                const count = completed.filter((s) => s.day_type === d).length;
                return (
                  <div key={d} className="bg-[#111] rounded-2xl p-3.5 border border-[#1e1e1e]">
                    <p className="text-2xl font-bold" style={{ color: ACCENT[d].color }}>{count}</p>
                    <p className="text-[#444] text-xs mt-0.5">{ACCENT[d].label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lift progression */}
        {completed.length > 0 && (
          <div>
            <p className="text-[#444] text-xs uppercase tracking-widest font-medium mb-4">Lift progression</p>
            <div className="space-y-3">
              {KEY_EXERCISES.map(({ name }) => {
                const rows = progress.filter((r) => r.exercise_name === name).sort((a, b) => a.date.localeCompare(b.date));
                if (!rows.length) return null;
                const weights = rows.map((r) => Number(r.max_weight));
                const first = weights[0], last = weights[weights.length - 1];
                const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
                const dayEntry = Object.entries(PROGRAM).find(([, exs]) => exs.some((e) => e.name === name));
                const day = dayEntry ? dayEntry[0] as DayType : "push";
                const ac = ACCENT[day];
                return (
                  <div key={name} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-medium text-sm">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: ac.color }}>{ac.label}</span>
                          <span className="text-[#333] text-xs">{rows.length} sessions</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold font-mono">{last}kg</p>
                        {pct !== 0 && (
                          <p className={`text-xs mt-0.5 ${pct > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {pct > 0 ? "+" : ""}{pct}%
                          </p>
                        )}
                      </div>
                    </div>
                    <Sparkline data={weights} color={ac.color} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!completed.length && (
          <div className="py-20 text-center">
            <p className="text-white font-semibold text-lg mb-2">No sessions yet</p>
            <p className="text-[#444] text-sm">Complete your first workout to see stats.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
