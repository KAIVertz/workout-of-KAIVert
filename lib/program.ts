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
  // LUNDI — PECTORAUX (priorité 2) + ABDOS (priorité 1)
  chest: [
    { name: "DB Floor Press",    sets: 5, reps: "10",    weight: "7-13kg", muscle: "Pectoraux",  illustration: "press",     tip: "5 séries aujourd'hui — pectoraux en priorité. Descend lentement sur 3s, pousse explosif. Coudes à 45°." },
    { name: "DB Floor Fly",      sets: 4, reps: "12",    weight: "5-7kg",  muscle: "Pectoraux",  illustration: "fly",       tip: "Bras en arc de cercle, sens l'étirement maximal en bas. Pectoraux plats = manque d'étirement. Corrige ça ici." },
    { name: "Push-up",           sets: 3, reps: "max",   weight: "Poids du corps", muscle: "Pectoraux", illustration: "pushup", tip: "Mains larges, corps droit. Va jusqu'à l'échec. C'est le finisseur — donne tout." },
    { name: "Leg Raise",         sets: 4, reps: "15",    weight: "Poids du corps", muscle: "Abdos bas",  illustration: "leg-raise", tip: "Jambes tendues, descend sans toucher le sol. Lent = efficace. Les abdos bas = la ligne en V." },
    { name: "Bicycle Crunch",    sets: 4, reps: "20",    weight: "Poids du corps", muscle: "Obliques",   illustration: "bicycle",   tip: "Coude vers genou opposé, rotation complète. Lent et contrôlé. Les obliques encadrent tes abdos." },
  ],
  // MARDI — BRAS (priorité 3) + ABDOS
  arms: [
    { name: "DB Bicep Curl",     sets: 4, reps: "12",    weight: "7kg",    muscle: "Biceps",     illustration: "curl",      tip: "Strict — pas de balancement. Tourne le poignet en haut pour la contraction maximale. Descends sur 3s." },
    { name: "DB Hammer Curl",    sets: 4, reps: "12",    weight: "7kg",    muscle: "Avant-bras", illustration: "curl",      tip: "Prise neutre. Travaille le brachial sous le biceps — c'est lui qui donne le volume et l'épaisseur." },
    { name: "DB Overhead Tricep Ext", sets: 4, reps: "12", weight: "5-7kg", muscle: "Triceps",  illustration: "overhead",  tip: "Coudes proches. Descends derrière la nuque, remonte. Triceps = 2/3 du volume du bras." },
    { name: "DB Wrist Curl",     sets: 3, reps: "20",    weight: "5kg",    muscle: "Avant-bras", illustration: "wrist",     tip: "Full range obligatoire. Les avant-bras se développent avec le volume et la fréquence — ne saute jamais ça." },
    { name: "Crunch",            sets: 4, reps: "25",    weight: "Poids du corps", muscle: "Abdos",     illustration: "crunch",    tip: "Expire fort à chaque rep. Contraction maximale en haut. Abdos tous les jours." },
  ],
  // MERCREDI — JAMBES (priorité 4) + ABDOS
  legs: [
    { name: "DB Goblet Squat",   sets: 4, reps: "15",    weight: "13kg",   muscle: "Cuisses",    illustration: "squat",     tip: "Descends profond, genoux dans l'axe des pieds. Pousse à travers les talons. Cuisses parallèles minimum." },
    { name: "DB Lunge",          sets: 3, reps: "10 ch.", weight: "7kg",    muscle: "Cuisses",    illustration: "lunge",     tip: "Contrôlé — pas en avant, genou arrière frôle le sol. Équilibre et force." },
    { name: "Wall Sit",          sets: 3, reps: "45s",   weight: "Poids du corps", muscle: "Cuisses",   illustration: "wall-sit", tip: "Dos contre le mur, cuisses parallèles. 45s. Ça brûle — c'est normal. Ne cède pas." },
    { name: "DB Calf Raise",     sets: 5, reps: "20",    weight: "13kg",   muscle: "Mollets",    illustration: "calf",      tip: "5 séries. Max étirement en bas, max contraction en haut. Les mollets ont besoin de volume pour grandir." },
    { name: "Russian Twist",     sets: 4, reps: "20",    weight: "5kg",    muscle: "Obliques",   illustration: "twist",     tip: "Pieds décollés, rotation complète. Haltère léger. La rotation = la taille fine et la ligne en V." },
  ],
  // JEUDI — PECTORAUX + BRAS (double priorité) + ABDOS
  power: [
    { name: "DB Floor Press",    sets: 4, reps: "10",    weight: "7-13kg", muscle: "Pectoraux",  illustration: "press",     tip: "2e jour pecto cette semaine. Essaie d'augmenter le poids ou les reps vs lundi. Progression = croissance." },
    { name: "DB Close-Grip Press", sets: 3, reps: "12",  weight: "7-10kg", muscle: "Triceps",    illustration: "press",     tip: "Haltères proches, coudes collés. Touche le triceps après les pecs — superposition parfaite." },
    { name: "DB Bicep Curl",     sets: 4, reps: "12",    weight: "7kg",    muscle: "Biceps",     illustration: "curl",      tip: "2e jour biceps. Forme parfaite — les bras se construisent dans la répétition propre, pas dans le poids." },
    { name: "DB Reverse Curl",   sets: 3, reps: "15",    weight: "5-7kg",  muscle: "Avant-bras", illustration: "curl",      tip: "Prise en pronation. Travaille le dessus des avant-bras. Clé pour des bras larges et équilibrés." },
    { name: "Leg Raise",         sets: 5, reps: "15",    weight: "Poids du corps", muscle: "Abdos bas",  illustration: "leg-raise", tip: "Abdos bas chaque jour. Descends lentement, contrôle total. C'est là que la ligne en V se forme." },
  ],
  // VENDREDI — CORPS COMPLET + ABDOS
  full: [
    { name: "DB Floor Press",    sets: 3, reps: "10",    weight: "7-13kg", muscle: "Pectoraux",  illustration: "press",     tip: "3e fois cette semaine. Si tu as progressé lundi et jeudi — augmente légèrement le poids." },
    { name: "DB Goblet Squat",   sets: 3, reps: "15",    weight: "13kg",   muscle: "Cuisses",    illustration: "squat",     tip: "Corps complet aujourd'hui. Squats profonds, contrôlés." },
    { name: "DB Bicep Curl",     sets: 3, reps: "12",    weight: "7kg",    muscle: "Biceps",     illustration: "curl",      tip: "Finisseur pour les bras. Même en fatigue — maintiens la forme." },
    { name: "DB Calf Raise",     sets: 3, reps: "20",    weight: "13kg",   muscle: "Mollets",    illustration: "calf",      tip: "Full range. Toujours." },
    { name: "V-sit",             sets: 4, reps: "12",    weight: "Poids du corps", muscle: "Abdos",     illustration: "vee",       tip: "En équilibre sur le coccyx. Jambes et torse forment un V. 1s de pause. Le meilleur exercice pour la définition." },
  ],
  // SAMEDI — JAMBES + MOLLETS + ABDOS
  legs2: [
    { name: "DB Romanian DL",    sets: 4, reps: "12",    weight: "13kg",   muscle: "Ischio-jambiers", illustration: "hinge", tip: "Dos droit, pousse les hanches en arrière. Sens les ischios s'étirer. Descend lentement." },
    { name: "DB Goblet Squat",   sets: 4, reps: "15",    weight: "13kg",   muscle: "Cuisses",    illustration: "squat",     tip: "2e jour jambes. Plus de volume aujourd'hui — 4 séries." },
    { name: "DB Calf Raise",     sets: 5, reps: "20",    weight: "13kg",   muscle: "Mollets",    illustration: "calf",      tip: "5 séries encore. Fréquence + volume = la seule façon de faire grandir les mollets." },
    { name: "Bicycle Crunch",    sets: 4, reps: "20",    weight: "Poids du corps", muscle: "Obliques",  illustration: "bicycle", tip: "Rotation complète. Les obliques construisent la taille fine et encadrent les abdos." },
    { name: "Plank",             sets: 3, reps: "60s",   weight: "Poids du corps", muscle: "Core",      illustration: "plank",  tip: "1 minute. Corps parfaitement droit. Serre abdos + fessiers + cuisses. Gainage complet." },
  ],
  // DIMANCHE — ABDOS PRIORITÉ ABSOLUE
  core: [
    { name: "Leg Raise",         sets: 5, reps: "20",    weight: "Poids du corps", muscle: "Abdos bas",  illustration: "leg-raise", tip: "Priorité 1 aujourd'hui. 5×20. Descend sans toucher le sol. Les abdos bas = la base de la ligne en V." },
    { name: "Bicycle Crunch",    sets: 5, reps: "25",    weight: "Poids du corps", muscle: "Obliques",   illustration: "bicycle",   tip: "5×25. Rotation complète, lente. C'est le volume qui fait apparaître les obliques." },
    { name: "Russian Twist",     sets: 4, reps: "20",    weight: "5kg",    muscle: "Obliques",   illustration: "twist",     tip: "Avec haltère. Pieds décollés. La taille fine se construit ici." },
    { name: "V-sit",             sets: 4, reps: "15",    weight: "Poids du corps", muscle: "Abdos",     illustration: "vee",       tip: "4×15. Si trop dur, genoux pliés. Build progressif — dans 4 semaines tu verras la différence." },
    { name: "Crunch",            sets: 3, reps: "30",    weight: "Poids du corps", muscle: "Abdos",     illustration: "crunch",    tip: "Finisseur. 30 reps, expire à chaque contraction. Dimanche = jour des abdos. Ne lâche pas." },
  ],
};
