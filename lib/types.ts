export interface Session {
  id: number;
  date: string;
  day_type: string;
  completed: boolean;
  created_at: string;
  duration_seconds?: number;
  notes?: string;
}

export interface Goal {
  id: number;
  label: string;
  target_value: number;
  unit: string;
  current_value: number;
  deadline?: string;
}

export interface NutritionLog {
  id: number;
  date: string;
  meal: string;
  protein_g: number;
}

export interface Log {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  flag?: string; // 'difficult' = set done but hard / needs work
}

export interface Override {
  sets?: number;
  weight?: string;
}

export interface AddedExercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  muscle: string;
  permanent: boolean;
}
