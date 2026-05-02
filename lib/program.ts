export type DayType = "chest" | "back" | "shoulders" | "arms" | "legs" | "full" | "core";
export type Intensity = "easy" | "medium" | "hard";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  tip: string;
  muscle: string;
}

// Every day has a workout — no rest days
export const WEEKLY_SCHEDULE: Record<number, DayType> = {
  0: "core",       // Sunday  — Core + V-line
  1: "chest",      // Monday  — Chest
  2: "back",       // Tuesday — Back + Forearms
  3: "shoulders",  // Wednesday — Shoulders
  4: "arms",       // Thursday — Arms + Forearms
  5: "legs",       // Friday  — Legs + Calves
  6: "full",       // Saturday — Full Body
};

export function getTodayDayType(): DayType {
  return WEEKLY_SCHEDULE[new Date().getDay()];
}

export function getSetCount(base: number, intensity: Intensity): number {
  if (intensity === "easy") return Math.max(2, base - 1);
  if (intensity === "hard") return base + 1;
  return base;
}

// Local date string (avoids UTC timezone shift bugs)
export function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// How many days since last session — used for AI adaptation
export function getMissedDays(sessions: { date: string; completed: boolean }[]): number {
  const completed = sessions.filter((s) => s.completed);
  if (!completed.length) return 0;
  const today = new Date();
  const last = new Date(completed[0].date + "T12:00:00");
  const days = Math.round((today.getTime() - last.getTime()) / 86400000);
  return Math.max(0, days - 1); // 0 = normal, 1+ = missed days
}

export function getAdaptation(missed: number): { extraSets: number; message: string } {
  if (missed === 0) return { extraSets: 0, message: "" };
  if (missed === 1) return { extraSets: 1, message: "Missed yesterday — +1 set per exercise" };
  if (missed === 2) return { extraSets: 2, message: "2 days off — session intensified" };
  return { extraSets: 2, message: `${missed} days off — maximum intensity` };
}

export const ACCENT: Record<DayType, { color: string; label: string; sub: string }> = {
  chest:     { color: "#e05555", label: "Chest",     sub: "Chest · Triceps" },
  back:      { color: "#4a90d9", label: "Back",      sub: "Back · Forearms · Rear Delts" },
  shoulders: { color: "#9b6ef0", label: "Shoulders", sub: "Shoulders · V-taper" },
  arms:      { color: "#e09a20", label: "Arms",      sub: "Biceps · Triceps · Forearms" },
  legs:      { color: "#3bb87a", label: "Legs",      sub: "Quads · Hamstrings · Calves" },
  full:      { color: "#20b2aa", label: "Full Body", sub: "Compound · Core · Calves" },
  core:      { color: "#e07840", label: "Core",      sub: "Abs · V-line · Calves" },
};

export const PROGRAM: Record<DayType, Exercise[]> = {
  chest: [
    { name: "DB Floor Press",    sets: 4, reps: "10-12", weight: "7-13kg",  muscle: "Chest",    tip: "Elbows 45° from body. Pause 1s at top. Slow down — 3 seconds on the way down." },
    { name: "DB Floor Fly",      sets: 3, reps: "12-15", weight: "5-7kg",   muscle: "Chest",    tip: "Wide arc, slight bend in elbows always. Squeeze chest hard at the top. Feel the stretch." },
    { name: "Push-up",           sets: 3, reps: "max",   weight: "BW",      muscle: "Chest",    tip: "Hands wide for chest. Lock the abs. Full range — chest touches floor." },
    { name: "Leg Raise",         sets: 4, reps: "15",    weight: "BW",      muscle: "Lower abs", tip: "Legs straight, lower slow. Don't swing. Lower abs = key to V-line." },
    { name: "DB Calf Raise",     sets: 3, reps: "20",    weight: "13kg",    muscle: "Calves",   tip: "Full range — max stretch at bottom, max contraction at top. Slow negative." },
  ],
  back: [
    { name: "DB Bent-over Row",  sets: 4, reps: "10-12", weight: "7-13kg",  muscle: "Back",     tip: "Hinge hips 45°. Pull to hip, not chest. Squeeze shoulder blade at top." },
    { name: "DB Reverse Fly",    sets: 3, reps: "15",    weight: "3-5kg",   muscle: "Rear Delts", tip: "Hinge forward, arms wide. Control on the way down. Rear delts are key for posture." },
    { name: "Band Face Pull",    sets: 3, reps: "20",    weight: "Band",    muscle: "Rear Delts", tip: "Anchor at head height. Pull to forehead, elbows high. Non-negotiable for posture." },
    { name: "DB Wrist Curl",     sets: 3, reps: "20",    weight: "5-7kg",   muscle: "Forearms", tip: "Forearm on thigh, wrist hanging. Full range. Forearms grow fast with volume." },
    { name: "Bicycle Crunch",    sets: 4, reps: "20",    weight: "BW",      muscle: "Obliques", tip: "Slow and controlled. Touch elbow to opposite knee. Obliques = V-line sides." },
  ],
  shoulders: [
    { name: "DB Shoulder Press", sets: 4, reps: "10-12", weight: "7kg",     muscle: "Shoulders", tip: "Press straight up, full lockout. No leaning back. Lower slow — 3 seconds." },
    { name: "DB Lateral Raise",  sets: 4, reps: "15",    weight: "3-5kg",   muscle: "Side Delts", tip: "Raise to shoulder height only. 3-second negative. These build your width — don't rush." },
    { name: "DB Front Raise",    sets: 3, reps: "12",    weight: "5kg",     muscle: "Front Delts", tip: "Alternating. Raise to eye level. Control the negative. No swinging." },
    { name: "Russian Twist",     sets: 4, reps: "20",    weight: "5-7kg",   muscle: "Obliques", tip: "Feet off floor. Rotate fully each side. This builds the V-line from the inside." },
    { name: "DB Calf Raise",     sets: 3, reps: "20",    weight: "13kg",    muscle: "Calves",   tip: "Full range always. 3-second negative. Calves need this to grow." },
  ],
  arms: [
    { name: "DB Bicep Curl",     sets: 3, reps: "12",    weight: "7kg",     muscle: "Biceps",   tip: "Strict form. Squeeze at top. Slow 3-second negative. No swinging." },
    { name: "DB Hammer Curl",    sets: 3, reps: "12",    weight: "7kg",     muscle: "Forearms", tip: "Neutral grip. Works brachialis — the muscle that pushes the bicep peak up." },
    { name: "DB Tricep Overhead Ext", sets: 3, reps: "12", weight: "5-7kg", muscle: "Triceps",  tip: "Keep elbows tight. Full stretch at bottom. Triceps = 2/3 of arm size." },
    { name: "DB Reverse Curl",   sets: 3, reps: "15",    weight: "5-7kg",   muscle: "Forearms", tip: "Overhand grip curl. Builds the top of the forearm — key for thick forearms." },
    { name: "Reverse Crunch",    sets: 4, reps: "20",    weight: "BW",      muscle: "Lower abs", tip: "Lift hips off floor using abs, not momentum. Best lower-abs exercise you can do." },
  ],
  legs: [
    { name: "DB Goblet Squat",   sets: 4, reps: "15",    weight: "13kg",    muscle: "Quads",    tip: "DB at chest. Deep squat, knees over toes. Drive through heels." },
    { name: "DB Romanian DL",    sets: 3, reps: "12",    weight: "13kg",    muscle: "Hamstrings", tip: "Soft knees, push hips back until hamstring pulls. Flat back. Slow negative." },
    { name: "DB Calf Raise",     sets: 5, reps: "20",    weight: "13kg",    muscle: "Calves",   tip: "Priority today — 5 sets. Full range every rep. Calves only grow with volume." },
    { name: "Leg Raise",         sets: 4, reps: "15",    weight: "BW",      muscle: "Lower abs", tip: "Slow and controlled. No swinging. Lower abs + hip flexors = visible V-line." },
  ],
  full: [
    { name: "DB Thruster",       sets: 3, reps: "10",    weight: "7kg",     muscle: "Full Body", tip: "Squat down with DBs at shoulders, then stand and press overhead in one motion." },
    { name: "DB Renegade Row",   sets: 3, reps: "8 each", weight: "7kg",    muscle: "Back/Core", tip: "Push-up position with DBs. Row one arm while stabilizing with the other. Core tight." },
    { name: "DB Lateral Raise",  sets: 3, reps: "15",    weight: "3-5kg",   muscle: "Side Delts", tip: "Even on full-body day — shoulder width is your best investment." },
    { name: "DB Calf Raise",     sets: 3, reps: "20",    weight: "13kg",    muscle: "Calves",   tip: "Never skip. 3 sets today, priority sets on Friday." },
    { name: "V-sit",             sets: 3, reps: "12",    weight: "BW",      muscle: "Core",     tip: "Balance on tailbone, legs and torso form a V. Hold 1s at the top. Best abs shape builder." },
  ],
  core: [
    { name: "Leg Raise",         sets: 5, reps: "15",    weight: "BW",      muscle: "Lower abs", tip: "Priority today — 5 sets. Slow and controlled. This builds the V-line directly." },
    { name: "Bicycle Crunch",    sets: 5, reps: "20",    weight: "BW",      muscle: "Obliques", tip: "Slow rotation. Elbow to opposite knee. Obliques frame the V-line." },
    { name: "Russian Twist",     sets: 4, reps: "20",    weight: "5-7kg",   muscle: "Obliques", tip: "Hold weight if you can. Feet off ground. Rotate fully each side." },
    { name: "Plank",             sets: 3, reps: "45s",   weight: "BW",      muscle: "Core",     tip: "Body straight as a board. Squeeze everything. Better 30s strict than 60s sloppy." },
    { name: "DB Calf Raise",     sets: 3, reps: "20",    weight: "13kg",    muscle: "Calves",   tip: "Never skip calves. Full range every single rep." },
  ],
};
