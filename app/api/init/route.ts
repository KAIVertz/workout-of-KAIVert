import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id            SERIAL PRIMARY KEY,
        date          TEXT NOT NULL,
        day_type      TEXT NOT NULL,
        completed     BOOLEAN DEFAULT FALSE,
        duration_seconds INTEGER,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER`;
    await sql`
      CREATE TABLE IF NOT EXISTS exercise_logs (
        id           SERIAL PRIMARY KEY,
        session_id   INTEGER REFERENCES workout_sessions(id) ON DELETE CASCADE,
        exercise_name TEXT NOT NULL,
        set_number   INTEGER NOT NULL,
        reps         INTEGER NOT NULL DEFAULT 0,
        weight_kg    NUMERIC NOT NULL DEFAULT 0,
        UNIQUE (session_id, exercise_name, set_number)
      )`;
    // Add unique constraint to existing table if it doesn't exist
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_exercise_logs
      ON exercise_logs (session_id, exercise_name, set_number)`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("init error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
