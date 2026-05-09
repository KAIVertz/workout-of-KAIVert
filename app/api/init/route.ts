import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      day_type TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      duration_seconds INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
  await sql`ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER`;
  await sql`
    CREATE TABLE IF NOT EXISTS exercise_logs (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_name TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL DEFAULT 0,
      weight_kg NUMERIC NOT NULL DEFAULT 0
    )`;
  return NextResponse.json({ ok: true });
}
