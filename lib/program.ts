export type DayType = "chest" | "arms" | "legs" | "power" | "full" | "legs2" | "core";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  tip: string;
  muscle: string;
  illustration: IllustrationType;
}

export type IllustrationType =
  | "press" | "fly" | "pushup" | "leg-raise" | "crunch"
  | "bicycle" | "twist" | "curl" | "overhead" | "wrist"
  | "squat" | "lunge" | "wall-sit" | "calf" | "plank" | "hinge" | "vee";

export const WEEKLY_SCHEDULE: Record<number, DayType> = {
  1: "chest",  // Monday
  2: "arms",   // Tuesday
  3: "legs",   // Wednesday
  4: "power",  // Thursday — chest + arms
  5: "full",   // Friday
  6: "legs2",  // Saturday
  0: "core",   // Sunday
};

export const DAY_LABEL: Record<DayType, { label: string; sub: string; color: string }> = {
  chest: { label: "Chest",     sub: "Pectoraux · Abdos",           color: "#c084fc" },
  arms:  { label: "Arms",      sub: "Biceps · Triceps · Avant-bras", color: "#f97316" },
  legs:  { label: "Legs",      sub: "Cuisses · Mollets · Abdos",   color: "#22c55e" },
  power: { label: "Power",     sub: "Chest · Arms · Abdos",        color: "#e879f9" },
  full:  { label: "Full Body", sub: "Corps complet · Abdos",       color: "#38bdf8" },
  legs2: { label: "Legs",      sub: "Mollets · Cuisses · Abdos",   color: "#4ade80" },
  core:  { label: "Core",      sub: "Abdos · Obliques · Gainage",  color: "#fb923c" },
};

export function getTodayType(): DayType {
  return WEEKLY_SCHEDULE[new Date().getDay()];
}

export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeStreak(sessions: { date: string; completed: boolean }[]): number {
  const dates = new Set(sessions.filter((s) => s.completed).map((s) => s.date));
  if (!dates.size) return 0;
  const today = localDate();
  const yesterday = localDate(new Date(Date.now() - 86400000));
  if (!dates.has(today) && !dates.has(yesterday)) return 0;
  let n = 0;
  const d = new Date();
  if (!dates.has(today)) d.setDate(d.getDate() - 1);
  while (dates.has(localDate(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function getMissedDays(sessions: { date: string; completed: boolean }[]): number {
  const done = sessions.filter((s) => s.completed);
  if (!done.length) return 0;
  const last = new Date(done[0].date + "T12:00:00");
  const days = Math.round((Date.now() - last.getTime()) / 86400000);
  return Math.max(0, days - 1);
}

export const PROGRAM: Record<DayType, Exercise[]> = {
  chest: [
    { name: "DB Floor Press",    sets: 4, reps: "12",    weight: "7-13kg", muscle: "Pectoraux",  illustration: "press",     tip: "Allongé, haltères à l'épaule. Pousse droit vers le haut, descend lentement sur 3 secondes. Coudes à 45°." },
    { name: "DB Floor Fly",      sets: 3, reps: "12",    weight: "5-7kg",  muscle: "Pectoraux",  illustration: "fly",       tip: "Bras écartés, légère flexion aux coudes. Monte en arc de cercle. Sens l'étirement dans la poitrine." },
    { name: "Push-up",           sets: 3, reps: "max",   weight: "Poids du corps", muscle: "Pectoraux", illustration: "pushup", tip: "Mains larges pour cibler les pectoraux. Corps droit. Descends jusqu'au sol. Monte explosif." },
    { name: "Leg Raise",         sets: 4, reps: "15",    weight: "Poids du corps", muscle: "Abdos bas",  illustration: "leg-raise", tip: "Allongé, jambes tendues. Monte à 90°, descend lentement. Ne touche pas le sol. Abdos bas = ligne en V." },
    { name: "Crunch",            sets: 3, reps: "20",    weight: "Poids du corps", muscle: "Abdos",      illustration: "crunch",    tip: "Mains derrière la tête. Lève les épaules, pas la nuque. Expire fort en haut. Contraction maximale." },
  ],
  arms: [
    { name: "DB Bicep Curl",     sets: 4, reps: "12",    weight: "7kg",    muscle: "Biceps",     illustration: "curl",      tip: "Strict — pas de balancement. Monte lentement, tourne le poignet en haut. Descends sur 3s." },
    { name: "DB Hammer Curl",    sets: 3, reps: "12",    weight: "7kg",    muscle: "Biceps/Avant-bras", illustration: "curl", tip: "Prise neutre (pouces vers le haut). Travaille le brachial — le muscle qui pousse le biceps vers le haut." },
    { name: "DB Overhead Tricep Ext", sets: 3, reps: "12", weight: "5-7kg", muscle: "Triceps",   illustration: "overhead",  tip: "Un haltère à deux mains au-dessus de la tête. Descends derrière le crâne, remonte. Coudes proches." },
    { name: "DB Wrist Curl",     sets: 3, reps: "20",    weight: "5kg",    muscle: "Avant-bras", illustration: "wrist",     tip: "Avant-bras sur la cuisse, poignet dans le vide. Monte et descends l'haltère. Full range obligatoire." },
    { name: "Bicycle Crunch",    sets: 4, reps: "20",    weight: "Poids du corps", muscle: "Obliques", illustration: "bicycle", tip: "Lent et contrôlé. Coude vers le genou opposé. Les obliques = le cadre de tes abdos." },
  ],
  legs: [
    { name: "DB Goblet Squat",   sets: 4, reps: "15",    weight: "13kg",   muscle: "Cuisses",    illustration: "squat",     tip: "Haltère contre la poitrine. Descends profond, genoux dans l'axe des pieds. Pousse à travers les talons." },
    { name: "DB Lunge",          sets: 3, reps: "10 ch.", weight: "7kg",    muscle: "Cuisses/Fessiers", illustration: "lunge", tip: "Pas en avant, genou avant à 90°. Le genou arrière frôle le sol. Reste contrôlé." },
    { name: "Wall Sit",          sets: 3, reps: "45s",   weight: "Poids du corps", muscle: "Cuisses",  illustration: "wall-sit", tip: "Dos contre le mur, cuisses parallèles au sol. 45 secondes. Brûle — c'est normal. Tiens." },
    { name: "DB Calf Raise",     sets: 5, reps: "20",    weight: "13kg",   muscle: "Mollets",    illustration: "calf",      tip: "5 séries aujourd'hui — les mollets ont besoin de volume. Full range : max étirement en bas, max contraction en haut." },
    { name: "Russian Twist",     sets: 4, reps: "20",    weight: "5kg",    muscle: "Obliques",   illustration: "twist",     tip: "Pieds décollés du sol. Rotation complète des deux côtés. Construit la ligne en V et la taille." },
  ],
  power: [
    { name: "DB Floor Press",    sets: 3, reps: "12",    weight: "7-13kg", muscle: "Pectoraux",  illustration: "press",     tip: "Deuxième jour poitrine. Monte le poids si tu peux. Descend en 3s, pousse fort." },
    { name: "DB Close-Grip Press", sets: 3, reps: "12",  weight: "7-10kg", muscle: "Triceps/Chest", illustration: "press",  tip: "Haltères proches, coudes collés au corps. Focus triceps. Bonne finition après les pecs." },
    { name: "DB Bicep Curl",     sets: 3, reps: "12",    weight: "7kg",    muscle: "Biceps",     illustration: "curl",      tip: "Strict. Tu reviens au biceps pour la deuxième fois cette semaine. Forme parfaite." },
    { name: "DB Reverse Curl",   sets: 3, reps: "15",    weight: "5-7kg",  muscle: "Avant-bras", illustration: "curl",      tip: "Prise en pronation (paumes vers le bas). Travaille le dessus des avant-bras — clé pour les bras larges." },
    { name: "Leg Raise",         sets: 4, reps: "15",    weight: "Poids du corps", muscle: "Abdos bas", illustration: "leg-raise", tip: "Abdos bas chaque jour. Contrôle la descente. C'est là que ça se construit." },
  ],
  full: [
    { name: "DB Goblet Squat",   sets: 3, reps: "12",    weight: "13kg",   muscle: "Cuisses",    illustration: "squat",     tip: "Corps complet aujourd'hui. Squat deep. Cuisses parallèles au sol minimum." },
    { name: "DB Floor Press",    sets: 3, reps: "10",    weight: "7-13kg", muscle: "Pectoraux",  illustration: "press",     tip: "Troisième fois cette semaine. Essaie d'augmenter les reps ou le poids." },
    { name: "DB Bicep Curl",     sets: 3, reps: "12",    weight: "7kg",    muscle: "Biceps",     illustration: "curl",      tip: "Finisseur pour les bras. Attention à la forme même en fatigue." },
    { name: "DB Calf Raise",     sets: 3, reps: "20",    weight: "13kg",   muscle: "Mollets",    illustration: "calf",      tip: "Ne saute jamais les mollets. Full range systématique." },
    { name: "V-sit",             sets: 3, reps: "12",    weight: "Poids du corps", muscle: "Abdos", illustration: "vee",   tip: "En équilibre sur le coccyx, jambes et torse forment un V. 1s de pause en haut. Le meilleur pour la définition abdominale." },
  ],
  legs2: [
    { name: "DB Romanian DL",    sets: 4, reps: "12",    weight: "13kg",   muscle: "Ischio-jambiers", illustration: "hinge", tip: "Dos droit, pousse les hanches en arrière jusqu'à sentir les ischios. Remonte en serrant les fessiers." },
    { name: "DB Goblet Squat",   sets: 3, reps: "15",    weight: "13kg",   muscle: "Cuisses",    illustration: "squat",     tip: "Second jour jambes. Plus de reps, même qualité." },
    { name: "DB Calf Raise",     sets: 5, reps: "20",    weight: "13kg",   muscle: "Mollets",    illustration: "calf",      tip: "5 séries. Les mollets ont besoin de fréquence ET de volume. Jamais de cheat reps." },
    { name: "Bicycle Crunch",    sets: 3, reps: "20",    weight: "Poids du corps", muscle: "Obliques", illustration: "bicycle", tip: "Lent. Pense à étirer l'oblique opposé à chaque répétition." },
    { name: "Plank",             sets: 3, reps: "45s",   weight: "Poids du corps", muscle: "Core",     illustration: "plank",  tip: "Corps parfaitement aligné. Serre tout — abdos, fessiers, cuisses. 45s strict." },
  ],
  core: [
    { name: "Leg Raise",         sets: 5, reps: "15",    weight: "Poids du corps", muscle: "Abdos bas", illustration: "leg-raise", tip: "5 séries. Descends lentement. Pas de rebond. Abdos bas = la base de la ligne en V." },
    { name: "Bicycle Crunch",    sets: 5, reps: "20",    weight: "Poids du corps", muscle: "Obliques", illustration: "bicycle",    tip: "5 séries. Touche le genou avec le coude opposé. Pense à la rotation du tronc." },
    { name: "Russian Twist",     sets: 4, reps: "20",    weight: "5kg",    muscle: "Obliques",   illustration: "twist",     tip: "Pieds décollés, haltère léger. Rotation complète à chaque répétition." },
    { name: "V-sit",             sets: 3, reps: "12",    weight: "Poids du corps", muscle: "Abdos", illustration: "vee",       tip: "Si trop dur, garde les genoux pliés. Build up progressivement." },
    { name: "Crunch",            sets: 3, reps: "25",    weight: "Poids du corps", muscle: "Abdos", illustration: "crunch",    tip: "Dimanche = volume max sur les abdos. Expire fort à chaque rep. Contraction maximale." },
  ],
};
