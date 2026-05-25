export type DayType = "chest" | "arms" | "legs" | "power" | "full" | "legs2" | "core";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;     // "10", "10-12", "max", "45s", "10 ch."
  weight: string;   // "7kg", "7-13kg", "Poids du corps"
  muscle: string;
  tip: string;
}

// Monday=1 … Sunday=0
export const WEEKLY_SCHEDULE: Record<number, DayType> = {
  1: "chest",
  2: "arms",
  3: "legs",
  4: "power",
  5: "full",
  6: "legs2",
  0: "core",
};

export const DAY_LABEL: Record<DayType, { label: string; sub: string; color: string }> = {
  chest: { label: "Chest",     sub: "Pectoraux · Abdos",               color: "#7C3AED" },
  arms:  { label: "Arms",      sub: "Biceps · Triceps · Avant-bras",   color: "#D97706" },
  legs:  { label: "Bras+",     sub: "Biceps · Triceps · Mollets · Obliques", color: "#059669" },
  power: { label: "Power",     sub: "Pectoraux · Bras · Abdos",              color: "#DC2626" },
  full:  { label: "Full",      sub: "Pectoraux · Bras · Abdos",              color: "#0284C7" },
  legs2: { label: "Chest+",    sub: "Pectoraux · Bras · Mollets",            color: "#0D9488" },
  core:  { label: "Core",      sub: "Abdos · Obliques · Gainage",      color: "#EA580C" },
};

export function getTodayType(): DayType {
  return WEEKLY_SCHEDULE[new Date().getDay()];
}

/** Local date string YYYY-MM-DD — never use toISOString() which shifts to UTC */
export function localDate(d = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function computeStreak(sessions: { date: string; completed: boolean }[]): number {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (!dates.size) return 0;
  const today = localDate();
  const yesterday = localDate(new Date(Date.now() - 86_400_000));
  if (!dates.has(today) && !dates.has(yesterday)) return 0;
  let n = 0;
  const d = new Date();
  if (!dates.has(today)) d.setDate(d.getDate() - 1);
  while (dates.has(localDate(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function getMissedDays(sessions: { date: string; completed: boolean }[]): number {
  const done = sessions.filter((s) => s.completed);
  if (!done.length) return 0;
  const last = new Date(done[0].date + "T12:00:00");
  return Math.max(0, Math.round((Date.now() - last.getTime()) / 86_400_000) - 1);
}

export const PROGRAM: Record<DayType, Exercise[]> = {
  chest: [
    { name: "DB Floor Press",    sets: 5, reps: "10",     weight: "7-13kg",         muscle: "Pectoraux",   tip: "Descends lentement sur 3s, pousse explosif. Coudes à 45°." },
    { name: "DB Floor Fly",      sets: 4, reps: "12",     weight: "5-7kg",          muscle: "Pectoraux",   tip: "Grand arc de cercle. Sens l'étirement en bas. Pectoraux plats = manque d'étirement." },
    { name: "Push-up",           sets: 3, reps: "max",    weight: "Poids du corps", muscle: "Pectoraux",   tip: "Mains larges pour les pecs. Corps droit, va jusqu'à l'échec." },
    { name: "Leg Raise",         sets: 4, reps: "15",     weight: "Poids du corps", muscle: "Abdos bas",   tip: "Jambes tendues, descend sans toucher le sol. Abdos bas = ligne en V." },
    { name: "Bicycle Crunch",    sets: 4, reps: "20",     weight: "Poids du corps", muscle: "Obliques",    tip: "Coude vers genou opposé, rotation complète. Lent = efficace." },
  ],
  arms: [
    { name: "DB Bicep Curl",           sets: 4, reps: "12",  weight: "7kg",            muscle: "Biceps",      tip: "Strict, pas de balancement. Tourne le poignet en haut. Descends sur 3s." },
    { name: "DB Hammer Curl",          sets: 4, reps: "12",  weight: "7kg",            muscle: "Avant-bras",  tip: "Prise neutre. Travaille le brachial — il pousse le biceps vers le haut." },
    { name: "DB Overhead Tricep Ext",  sets: 4, reps: "12",  weight: "5-7kg",          muscle: "Triceps",     tip: "Coudes proches. Descends derrière la nuque. Triceps = 2/3 du volume du bras." },
    { name: "DB Wrist Curl",           sets: 3, reps: "20",  weight: "5kg",            muscle: "Avant-bras",  tip: "Avant-bras sur la cuisse, poignet dans le vide. Full range obligatoire." },
    { name: "Crunch",                  sets: 4, reps: "25",  weight: "Poids du corps", muscle: "Abdos",       tip: "Expire fort à chaque rep. Contraction maximale en haut." },
  ],
  legs: [
    { name: "DB Bicep Curl",          sets: 4, reps: "12", weight: "7kg",    muscle: "Biceps",     tip: "Strict, pas de balancement. Tourne le poignet en haut. Descends sur 3s." },
    { name: "DB Hammer Curl",         sets: 4, reps: "12", weight: "7kg",    muscle: "Avant-bras", tip: "Prise neutre. Brachial + avant-bras. Pose de la fondation des bras." },
    { name: "DB Overhead Tricep Ext", sets: 4, reps: "12", weight: "5-7kg",  muscle: "Triceps",    tip: "Coudes proches. Descends derrière la nuque. Triceps = 2/3 du volume du bras." },
    { name: "DB Calf Raise",          sets: 5, reps: "20", weight: "13kg",   muscle: "Mollets",    tip: "Max étirement en bas, max contraction en haut. Fréquence = la seule façon de les faire grandir." },
    { name: "Russian Twist",          sets: 4, reps: "20", weight: "5kg",    muscle: "Obliques",   tip: "Pieds décollés, rotation complète. La taille fine se construit ici." },
  ],
  power: [
    { name: "DB Floor Press",       sets: 4, reps: "10",  weight: "7-13kg",         muscle: "Pectoraux",   tip: "2e jour pecto. Essaie d'augmenter le poids vs lundi." },
    { name: "DB Close-Grip Press",  sets: 3, reps: "12",  weight: "7-10kg",         muscle: "Triceps",     tip: "Haltères proches, coudes collés. Focus triceps après les pecs." },
    { name: "DB Bicep Curl",        sets: 4, reps: "12",  weight: "7kg",            muscle: "Biceps",      tip: "2e jour biceps. Forme parfaite — c'est la répétition propre qui construit." },
    { name: "DB Reverse Curl",      sets: 3, reps: "15",  weight: "5-7kg",          muscle: "Avant-bras",  tip: "Prise en pronation. Dessus des avant-bras. Clé pour des bras larges." },
    { name: "Leg Raise",            sets: 5, reps: "15",  weight: "Poids du corps", muscle: "Abdos bas",   tip: "Abdos bas chaque jour. Descends lentement, contrôle total." },
  ],
  full: [
    { name: "DB Floor Press",         sets: 3, reps: "10", weight: "7-13kg",         muscle: "Pectoraux",  tip: "3e fois cette semaine. Augmente le poids si possible." },
    { name: "DB Bicep Curl",          sets: 3, reps: "12", weight: "7kg",            muscle: "Biceps",     tip: "Maintiens la forme même en fatigue." },
    { name: "DB Overhead Tricep Ext", sets: 3, reps: "12", weight: "5-7kg",          muscle: "Triceps",    tip: "Coudes proches, dos droit. Descends lentement derrière la nuque." },
    { name: "DB Calf Raise",          sets: 3, reps: "20", weight: "13kg",           muscle: "Mollets",    tip: "Full range systématique. Ne saute jamais les mollets." },
    { name: "V-sit",                  sets: 4, reps: "12", weight: "Poids du corps", muscle: "Abdos",      tip: "Équilibre sur le coccyx, V entre jambes et torse. 1s pause en haut." },
  ],
  legs2: [
    { name: "DB Floor Press",         sets: 4, reps: "10", weight: "7-13kg",         muscle: "Pectoraux",  tip: "Charge max, descends lentement sur 3s. Pecs en fin de semaine — push fort." },
    { name: "DB Close-Grip Press",    sets: 3, reps: "12", weight: "7-10kg",         muscle: "Triceps",    tip: "Coudes collés au corps. Focus triceps après les pecs." },
    { name: "DB Reverse Curl",        sets: 3, reps: "15", weight: "5-7kg",          muscle: "Avant-bras", tip: "Prise pronation. Dessus des avant-bras. Clé pour des bras larges." },
    { name: "DB Calf Raise",          sets: 5, reps: "20", weight: "13kg",           muscle: "Mollets",    tip: "5 séries. Fréquence + volume = la seule façon de faire grandir les mollets." },
    { name: "Bicycle Crunch",         sets: 4, reps: "20", weight: "Poids du corps", muscle: "Obliques",   tip: "Obliques = cadre des abdos. Rotation complète à chaque rep." },
  ],
  core: [
    { name: "Leg Raise",         sets: 5, reps: "20",     weight: "Poids du corps", muscle: "Abdos bas",   tip: "Priorité absolue. Descends sans toucher le sol. Lent = efficace." },
    { name: "Bicycle Crunch",    sets: 5, reps: "25",     weight: "Poids du corps", muscle: "Obliques",    tip: "Rotation complète. Lent. C'est le volume qui fait apparaître les obliques." },
    { name: "Russian Twist",     sets: 4, reps: "20",     weight: "5kg",            muscle: "Obliques",    tip: "Haltère léger, pieds décollés. La taille fine se construit ici." },
    { name: "V-sit",             sets: 4, reps: "15",     weight: "Poids du corps", muscle: "Abdos",       tip: "Si trop dur, genoux pliés. Progress semaine par semaine." },
    { name: "Crunch",            sets: 3, reps: "30",     weight: "Poids du corps", muscle: "Abdos",       tip: "Finisseur. 30 reps, expire fort. Dimanche = jour des abdos." },
  ],
};
