export type DayType = "push" | "pull" | "legs" | "arms" | "chest" | "legs2";
export type Intensity = "easy" | "medium" | "hard";

export interface Exercise {
  name: string;
  sets: number; // medium base
  reps: string;
  weight: string;
  tip: string;
  muscle: string;
}

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

export function getSetCount(base: number, intensity: Intensity): number {
  if (intensity === "easy") return Math.max(2, base - 1);
  if (intensity === "hard") return base + 1;
  return base;
}

export const ACCENT: Record<DayType, { color: string; text: string; label: string; sub: string }> = {
  push:  { color: "#f97316", text: "text-orange-400", label: "Push",  sub: "Chest · Shoulders · Triceps" },
  pull:  { color: "#3b82f6", text: "text-blue-400",   label: "Pull",  sub: "Back · Biceps · Rear Delts" },
  legs:  { color: "#22c55e", text: "text-green-400",  label: "Legs",  sub: "Quads · Hamstrings · Calves" },
  arms:  { color: "#a855f7", text: "text-purple-400", label: "Arms",  sub: "Biceps · Triceps" },
  chest: { color: "#ef4444", text: "text-red-400",    label: "Chest", sub: "Chest · Side Delts" },
  legs2: { color: "#14b8a6", text: "text-teal-400",   label: "Legs+", sub: "Glutes · Calves" },
};

export const PROGRAM: Record<DayType, Exercise[]> = {
  push: [
    { name: "DB Floor Press",         sets: 4, reps: "10-12", weight: "7-13kg",       muscle: "Chest",     tip: "Lie flat, press straight up. Elbows 45° from body. Slow on the way down — that's where the growth is." },
    { name: "DB Shoulder Press",      sets: 4, reps: "10-12", weight: "7kg",          muscle: "Shoulders", tip: "Press straight up, don't lean back. Lock out fully at top. Control the descent." },
    { name: "DB Lateral Raise",       sets: 3, reps: "15",    weight: "3-5kg",        muscle: "Side Delts", tip: "Raise to shoulder height only. Slight bend in elbows. 3-second negative builds width fast." },
    { name: "DB Tricep Overhead Ext", sets: 3, reps: "12",    weight: "5-7kg",        muscle: "Triceps",   tip: "Both hands on one DB, lower behind head. Keep elbows in tight. Full stretch at bottom." },
  ],
  pull: [
    { name: "DB Bent-over Row",       sets: 4, reps: "10-12", weight: "7-13kg",       muscle: "Back",      tip: "Hinge hips to 45°, pull to hip not chest. Squeeze shoulder blade hard at top. Slow negative." },
    { name: "DB Bicep Curl",          sets: 4, reps: "12",    weight: "7kg",          muscle: "Biceps",    tip: "Full range. Rotate wrist at top for full contraction. No swinging — strict." },
    { name: "DB Hammer Curl",         sets: 3, reps: "12",    weight: "7kg",          muscle: "Brachialis", tip: "Neutral grip (thumbs up). Works brachialis — the muscle that pushes your bicep peak up." },
    { name: "Band Face Pull",         sets: 3, reps: "15",    weight: "Band on wall", muscle: "Rear Delts", tip: "Anchor at head height. Pull to forehead, elbows high and wide. Non-negotiable for posture." },
  ],
  legs: [
    { name: "DB Goblet Squat",        sets: 4, reps: "12-15", weight: "13kg",         muscle: "Quads",     tip: "DB at chest. Squat deep, knees track over toes. Drive through heels to stand." },
    { name: "DB Romanian Deadlift",   sets: 4, reps: "12",    weight: "13kg",         muscle: "Hamstrings", tip: "Soft knees, push hips back until you feel hamstring pull. Keep back flat. Slow negative." },
    { name: "DB Reverse Lunge",       sets: 3, reps: "10 each", weight: "7kg",        muscle: "Glutes",    tip: "Step back, front knee stays over ankle. Lower until back knee nearly touches floor." },
    { name: "DB Calf Raise",          sets: 3, reps: "20",    weight: "13kg",         muscle: "Calves",    tip: "Full range — max stretch at bottom, max contraction at top. Slow on the way down." },
  ],
  arms: [
    { name: "DB Bicep Curl",          sets: 4, reps: "12",    weight: "7-10kg",       muscle: "Biceps",    tip: "Full range. Squeeze at the top. Slow 3-second negative. No momentum." },
    { name: "DB Hammer Curl",         sets: 3, reps: "12",    weight: "7kg",          muscle: "Brachialis", tip: "Neutral grip. Control throughout. Thicker arms come from the brachialis underneath." },
    { name: "DB Close-Grip Floor Press", sets: 4, reps: "10-12", weight: "7-10kg",   muscle: "Triceps",   tip: "DBs close, elbows tight to ribs. Tricep focus. Press explosively, lower slowly." },
    { name: "DB Tricep Overhead Ext", sets: 3, reps: "12",    weight: "5-7kg",        muscle: "Triceps",   tip: "Arms overhead, lower behind head. The long head only gets hit in this position." },
  ],
  chest: [
    { name: "DB Floor Fly",           sets: 4, reps: "12",    weight: "5-7kg",        muscle: "Chest",     tip: "Wide arc, feel the stretch. Slight bend in elbows always. Squeeze hard at the top." },
    { name: "DB Floor Press",         sets: 4, reps: "10-12", weight: "7-13kg",       muscle: "Chest",     tip: "After flyes your chest is pumped — press with intention. Elbows 45°, full lockout." },
    { name: "DB Lateral Raise",       sets: 3, reps: "15",    weight: "3-5kg",        muscle: "Side Delts", tip: "Slow and controlled. Shoulders get wide from these done right — don't rush." },
    { name: "DB Close-Grip Floor Press", sets: 3, reps: "10-12", weight: "7kg",       muscle: "Triceps",   tip: "Finisher. Elbows in tight, full extension at top. Good pump after chest work." },
  ],
  legs2: [
    { name: "Band Squat",             sets: 4, reps: "15",    weight: "25kg band",    muscle: "Quads",     tip: "Stand on band, hold at shoulders. Deep squat, stay controlled. High reps build endurance + size." },
    { name: "Band Hip Thrust",        sets: 4, reps: "15",    weight: "Band on hips", muscle: "Glutes",    tip: "Shoulders on floor, band across hips. Drive up, squeeze glutes hard at top. Full hip extension." },
    { name: "DB Calf Raise",          sets: 3, reps: "20",    weight: "13kg",         muscle: "Calves",    tip: "Step on something for full range. Slow negative is key. Calves respond to volume." },
    { name: "DB Reverse Lunge",       sets: 3, reps: "10 each", weight: "7kg",        muscle: "Glutes",    tip: "Finish strong. Step back, control the descent, drive through front heel to stand." },
  ],
};
