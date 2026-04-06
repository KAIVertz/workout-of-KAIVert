import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      day_type VARCHAR(10) NOT NULL,
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS exercise_logs (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_name VARCHAR(100) NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight_kg DECIMAL(5,2),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}
