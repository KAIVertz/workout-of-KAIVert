export type DayType = "push" | "pull" | "legs" | "arms" | "chest" | "legs2";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  tip: string;
  muscle: string;
}

// Fixed weekly schedule — based on day of week (0 = Sun)
export const WEEKLY_SCHEDULE: Record<number, DayType | null> = {
  0: null,      // Sunday  — rest
  1: "push",    // Monday
  2: "pull",    // Tuesday
  3: "legs",    // Wednesday
  4: "arms",    // Thursday
  5: "chest",   // Friday
  6: "legs2",   // Saturday
};

export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function getTodayDayType(): DayType | null {
  return WEEKLY_SCHEDULE[new Date().getDay()] ?? null;
}

export const ACCENT: Record<DayType, { color: string; text: string; label: string; sub: string }> = {
  push:  { color: "#f97316", text: "text-orange-400", label: "PUSH",  sub: "Chest · Shoulders · Triceps" },
  pull:  { color: "#3b82f6", text: "text-blue-400",   label: "PULL",  sub: "Back · Biceps" },
  legs:  { color: "#22c55e", text: "text-green-400",  label: "LEGS",  sub: "Quads · Hamstrings · Glutes" },
  arms:  { color: "#a855f7", text: "text-purple-400", label: "ARMS",  sub: "Biceps · Triceps · Chest" },
  chest: { color: "#ef4444", text: "text-red-400",    label: "CHEST", sub: "Chest · Side Delts" },
  legs2: { color: "#14b8a6", text: "text-teal-400",   label: "LEGS",  sub: "Glutes · Calves" },
};

export const PROGRAM: Record<DayType, Exercise[]> = {
  push: [
    { name: "DB Floor Press",          sets: 4, reps: "10-12",   weight: "7-13kg",      muscle: "Chest",     tip: "Lie on floor, press DBs up. Elbows 45° from body. Full control on the way down." },
    { name: "DB Shoulder Press",       sets: 3, reps: "10-12",   weight: "7kg",         muscle: "Shoulders", tip: "Seated or standing. Press straight up. Don't flare elbows outward." },
    { name: "DB Tricep Overhead Ext",  sets: 3, reps: "12",      weight: "5-7kg",       muscle: "Triceps",   tip: "One DB with both hands overhead. Lower behind head. Keep elbows tight." },
  ],
  pull: [
    { name: "DB Bent-over Row",        sets: 4, reps: "10-12",   weight: "7-13kg",      muscle: "Back",      tip: "Hinge at hips 45°. Pull to hip, not chest. Squeeze shoulder blade at top." },
    { name: "DB Bicep Curl",           sets: 3, reps: "12",      weight: "7kg",         muscle: "Biceps",    tip: "Full range. Supinate wrist at top. Slow and controlled on the way down." },
    { name: "Band Face Pull",          sets: 3, reps: "15",      weight: "Band on wall", muscle: "Rear Delts", tip: "Anchor band at head height. Pull to forehead, elbows high. Key for posture." },
  ],
  legs: [
    { name: "DB Goblet Squat",         sets: 4, reps: "12-15",   weight: "13kg",        muscle: "Quads",     tip: "Hold DB at chest. Squat deep, knees track over toes. Stay quiet on landing." },
    { name: "DB Romanian Deadlift",    sets: 3, reps: "12",      weight: "13kg",        muscle: "Hamstrings", tip: "Soft knees, push hips back. Feel the hamstring stretch. Slow down." },
    { name: "DB Reverse Lunge",        sets: 3, reps: "10 each", weight: "7kg",         muscle: "Glutes",    tip: "Step back quietly. Front knee stays over ankle. Controlled throughout." },
  ],
  arms: [
    { name: "DB Bicep Curl",           sets: 4, reps: "12",      weight: "7-10kg",      muscle: "Biceps",    tip: "Full range. Squeeze hard at the top. No swinging — strict form." },
    { name: "DB Hammer Curl",          sets: 3, reps: "12",      weight: "7kg",         muscle: "Brachialis", tip: "Neutral grip (thumbs up). Works brachialis = thicker looking arms." },
    { name: "DB Close-Grip Floor Press", sets: 3, reps: "10-12", weight: "7-10kg",      muscle: "Triceps",   tip: "DBs close together, elbows tight to body. Tricep focus, no pushup needed." },
    { name: "DB Floor Fly",            sets: 3, reps: "12",      weight: "5-7kg",       muscle: "Chest",     tip: "Wide arc, slight bend in elbows. Squeeze chest. Don't go too heavy here." },
  ],
  chest: [
    { name: "DB Floor Fly",            sets: 4, reps: "12",      weight: "5-7kg",       muscle: "Chest",     tip: "Wide arc, feel the stretch. Squeeze chest hard at the top. Slow negative." },
    { name: "DB Lateral Raise",        sets: 3, reps: "15",      weight: "3-5kg",       muscle: "Side Delts", tip: "Slight bend in elbows. Raise to shoulder height only. Very slow on the way down." },
    { name: "DB Close-Grip Floor Press", sets: 3, reps: "10-12", weight: "7kg",         muscle: "Chest",     tip: "Narrow grip, elbows in tight. Great chest + tricep finisher." },
  ],
  legs2: [
    { name: "Band Squat",              sets: 4, reps: "15",      weight: "25kg band",   muscle: "Quads",     tip: "Stand on band, hold ends at shoulders. Squat deep and quiet. Controlled." },
    { name: "Band Hip Thrust",         sets: 4, reps: "15",      weight: "Band on hips", muscle: "Glutes",   tip: "Shoulders on floor, band across hips anchored under feet. Drive up, squeeze at top." },
    { name: "DB Calf Raise",           sets: 3, reps: "20",      weight: "13kg",        muscle: "Calves",    tip: "Stand on edge of something. Full range of motion. Slow on the way down." },
  ],
};
