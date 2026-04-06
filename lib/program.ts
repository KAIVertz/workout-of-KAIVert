export type DayType = "push" | "pull" | "legs";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  tip: string;
}

export const PROGRAM: Record<DayType, { label: string; color: string; exercises: Exercise[] }> = {
  push: {
    label: "PUSH",
    color: "orange",
    exercises: [
      {
        name: "Floor DB Press",
        sets: 4,
        reps: "8-12",
        weight: "7-13kg",
        tip: "Lie on floor, press DBs up. Elbows 45° from body.",
      },
      {
        name: "DB Floor Fly",
        sets: 3,
        reps: "12",
        weight: "5-7kg",
        tip: "Arms wide, slight bend. Squeeze chest at top.",
      },
      {
        name: "DB Shoulder Press",
        sets: 4,
        reps: "10-12",
        weight: "7kg",
        tip: "Seated on floor or standing. Press overhead.",
      },
      {
        name: "DB Lateral Raise",
        sets: 3,
        reps: "15",
        weight: "3-5kg",
        tip: "Slow on the way down. No swinging.",
      },
      {
        name: "DB Tricep Overhead Ext",
        sets: 3,
        reps: "12",
        weight: "5-7kg",
        tip: "One DB held with both hands over head. Lower behind.",
      },
      {
        name: "DB Close-Grip Floor Press",
        sets: 3,
        reps: "10-12",
        weight: "7-10kg",
        tip: "DBs close together, elbows tight to body. Crushes triceps. No pushup needed.",
      },
    ],
  },
  pull: {
    label: "PULL",
    color: "blue",
    exercises: [
      {
        name: "DB Bent-over Row",
        sets: 4,
        reps: "10-12",
        weight: "7-13kg",
        tip: "Hinge at hips, pull DBs to hips. Squeeze back.",
      },
      {
        name: "DB Bicep Curl",
        sets: 4,
        reps: "12",
        weight: "7-10kg",
        tip: "Full range. Squeeze at top. No swinging.",
      },
      {
        name: "DB Hammer Curl",
        sets: 3,
        reps: "12",
        weight: "7kg",
        tip: "Neutral grip (thumbs up). Works brachialis.",
      },
      {
        name: "Band Face Pull",
        sets: 3,
        reps: "15-20",
        weight: "Band on wall",
        tip: "Hook band on wall at head height. Pull to face, elbows high.",
      },
      {
        name: "Band Pull-Apart",
        sets: 3,
        reps: "20",
        weight: "Band",
        tip: "Arms straight, pull band apart across chest.",
      },
      {
        name: "DB Shrug",
        sets: 3,
        reps: "15",
        weight: "13kg",
        tip: "Hold DBs at sides, shrug straight up. Hold 1 sec.",
      },
    ],
  },
  legs: {
    label: "LEGS",
    color: "green",
    exercises: [
      {
        name: "DB Goblet Squat",
        sets: 4,
        reps: "12-15",
        weight: "13kg",
        tip: "Hold one DB at chest. Squat deep. Stay quiet on landing.",
      },
      {
        name: "DB Romanian Deadlift",
        sets: 4,
        reps: "10-12",
        weight: "13kg",
        tip: "Soft knees, push hips back. Feel hamstring stretch.",
      },
      {
        name: "DB Reverse Lunge",
        sets: 3,
        reps: "10 each leg",
        weight: "7kg",
        tip: "Step back quietly. Front knee over ankle.",
      },
      {
        name: "Band Squat",
        sets: 3,
        reps: "15",
        weight: "25kg band",
        tip: "Stand on band, hold ends at shoulders. Squat deep.",
      },
      {
        name: "Band Hip Thrust",
        sets: 3,
        reps: "15",
        weight: "Band over hips",
        tip: "Shoulders on floor, band anchored under feet. Drive hips up.",
      },
      {
        name: "DB Calf Raise",
        sets: 4,
        reps: "20",
        weight: "13kg",
        tip: "Stand on edge of something. Full range. Slow down.",
      },
    ],
  },
};

export const DAY_CYCLE: DayType[] = ["push", "pull", "legs"];

export function getNextDayType(lastDayType: DayType | null): DayType {
  if (!lastDayType) return "push";
  const idx = DAY_CYCLE.indexOf(lastDayType);
  return DAY_CYCLE[(idx + 1) % DAY_CYCLE.length];
}
