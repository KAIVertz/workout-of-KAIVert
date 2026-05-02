"use client";

import { useEffect, useState } from "react";
import { PROGRAM, ACCENT, DayType, WEEKLY_SCHEDULE, localDateStr } from "@/lib/program";
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
  exercise_name: string;
  max_weight: number;
  max_reps: number;
}

const ALL_DAYS = Object.values(WEEKLY_SCHEDULE).filter(
  (v, i, arr) => arr.indexOf(v) === i
) as DayType[];

const KEY_LIFTS = [
  "DB Floor Press", "DB Bent-over Row", "DB Shoulder Press",
  "DB Lateral Raise", "DB Goblet Squat", "DB Bicep Curl",
  "Leg Raise", "DB Calf Raise",
];

function localDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return localDateStr(d);
}

function computeStreak(sessions: Session[]): { current: number; best: number } {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (!dates.size) return { current: 0, best: 0 };

  const today = localDate(0);
  const yesterday = localDate(-1);
  let current = 0;
  if (dates.has(today) || dates.has(yesterday)) {
    const d = new Date();
    if (!dates.has(today)) d.setDate(d.getDate() - 1);
    while (dates.has(localDateStr(d))) {
      current++;
      d.setDate(d.getDate() - 1);
    }
  }

  let best = 0, run = 0;
  const sorted = Array.from(dates).sort();
  const scan = new Date(sorted[0] + "T12:00:00");
  const last = new Date(sorted[sorted.length - 1] + "T12:00:00");
  while (scan <= last) {
    if (dates.has(localDateStr(scan))) { run++; best = Math.max(best, run); } else run = 0;
    scan.setDate(scan.getDate() + 1);
  }
  return { current, best: Math.max(best, current) };
}

function getWeeks(n: number): string[][] {
  const today = new Date();
  const dow = today.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - daysFromMon);
  return Array.from({ length: n }, (_, wi) =>
    Array.from({ length: 7 }, (__, di) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() - (n - 1 - wi) * 7 + di);
      return localDateStr(d);
    })
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const W = 80, H = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lx = W, ly = H - ((data[data.length - 1] - min) / range) * (H - 4) - 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: H }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
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
  const { current: streak, best: bestStreak } = computeStreak(sessions);
  const weeks = getWeeks(5);
  const completedMap = new Map(completed.map((s) => [s.date, s.day_type]));
  const todayStr = localDate(0);

  // This week
  const dow = new Date().getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const thisWeekDays = Array.from({ length: 7 }, (_, i) => localDate(i - daysFromMon));
  const thisWeekCount = thisWeekDays.filter((d) => completedMap.has(d)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#333] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="px-5 pt-14 pb-6 border-b border-[#111]">
        <p className="text-[#444] text-sm mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-4xl font-bold text-white tracking-tight">Stats</h1>
      </div>

      <div className="max-w-md mx-auto px-5 py-8 space-y-10">

        {/* KPIs */}
        <div className="flex gap-8">
          {[
            { label: "Streak",   value: streak,          unit: "days"     },
            { label: "Best",     value: bestStreak,       unit: "days"     },
            { label: "Total",    value: completed.length, unit: "sessions" },
            { label: "This week",value: thisWeekCount,    unit: "/ 7"      },
          ].map((k) => (
            <div key={k.label}>
              <p className="text-[#444] text-xs">{k.label}</p>
              <p className="text-white text-2xl font-bold mt-0.5 tabular-nums">{k.value}</p>
              <p className="text-[#333] text-xs mt-0.5">{k.unit}</p>
            </div>
          ))}
        </div>

        {/* Activity calendar (5 weeks × 7 days) */}
        <div>
          <p className="text-[#333] text-xs uppercase tracking-widest mb-4">Activity</p>
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex gap-1.5">
                {week.map((d, di) => {
                  const dt = completedMap.get(d);
                  const isFuture = d > todayStr;
                  return (
                    <div
                      key={di}
                      className="flex-1 h-7 rounded-md"
                      style={
                        dt
                          ? { background: ACCENT[dt].color + "30", border: `1px solid ${ACCENT[dt].color}50` }
                          : { background: isFuture ? "transparent" : "#0a0a0a", border: "1px solid #111" }
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
          <div className="flex gap-4 mt-3 flex-wrap">
            {ALL_DAYS.map((d) => (
              <div key={d} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT[d].color }} />
                <span className="text-[10px] text-[#444]">{ACCENT[d].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions per type */}
        {completed.length > 0 && (
          <div>
            <p className="text-[#333] text-xs uppercase tracking-widest mb-4">By type</p>
            <div className="space-y-3">
              {ALL_DAYS.map((d) => {
                const count = completed.filter((s) => s.day_type === d).length;
                const pct = completed.length > 0 ? (count / completed.length) * 100 : 0;
                return (
                  <div key={d} className="flex items-center gap-3">
                    <p className="text-[#555] text-sm w-20 shrink-0">{ACCENT[d].label}</p>
                    <div className="flex-1 h-px bg-[#111] relative">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT[d].color + "80" }} />
                    </div>
                    <p className="text-[#444] text-sm tabular-nums w-4 text-right">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lift progression */}
        {completed.length > 0 && (
          <div>
            <p className="text-[#333] text-xs uppercase tracking-widest mb-4">Progression</p>
            <div className="space-y-4">
              {KEY_LIFTS.map((name) => {
                const rows = progress.filter((r) => r.exercise_name === name).sort((a, b) => a.date.localeCompare(b.date));
                if (!rows.length) return null;
                const weights = rows.map((r) => Number(r.max_weight));
                const first = weights[0], last = weights[weights.length - 1];
                const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
                const dayEntry = Object.entries(PROGRAM).find(([, exs]) => exs.some((e) => e.name === name));
                const day = (dayEntry?.[0] ?? "chest") as DayType;
                return (
                  <div key={name} className="flex items-center justify-between py-3 border-b border-[#0d0d0d]">
                    <div>
                      <p className="text-white text-sm">{name}</p>
                      <p className="text-[#333] text-xs mt-0.5">{rows.length} sessions</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Sparkline data={weights} color={ACCENT[day].color} />
                      <div className="text-right w-16">
                        <p className="text-white font-mono text-sm">{last}kg</p>
                        {pct !== 0 && (
                          <p className={`text-xs mt-0.5 ${pct > 0 ? "text-[#3bb87a]" : "text-[#e05555]"}`}>
                            {pct > 0 ? "+" : ""}{pct}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!completed.length && (
          <div className="py-16 text-center">
            <p className="text-white font-semibold mb-2">No sessions yet</p>
            <p className="text-[#444] text-sm">Start your first workout.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
