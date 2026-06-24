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
    await sql`ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS body_weight NUMERIC`;
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

    await sql`CREATE TABLE IF NOT EXISTS daily_checkins (
      id            SERIAL PRIMARY KEY,
      date          TEXT NOT NULL UNIQUE,
      energy        INTEGER CHECK (energy BETWEEN 1 AND 5),
      sleep_hours   NUMERIC,
      sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
      mood          TEXT,
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS pain_logs (
      id          SERIAL PRIMARY KEY,
      checkin_id  INTEGER REFERENCES daily_checkins(id) ON DELETE CASCADE,
      zone        TEXT NOT NULL,
      intensity   INTEGER CHECK (intensity BETWEEN 1 AND 3)
    )`;

    await sql`CREATE TABLE IF NOT EXISTS program_overrides (
      exercise_name TEXT PRIMARY KEY,
      sets          INTEGER,
      weight        TEXT,
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         SERIAL PRIMARY KEY,
      endpoint   TEXT NOT NULL UNIQUE,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS user_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`;

    await sql`ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS notes TEXT`;
    await sql`ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS flag TEXT`;

    await sql`CREATE TABLE IF NOT EXISTS goals (
      id            SERIAL PRIMARY KEY,
      label         TEXT NOT NULL,
      target_value  NUMERIC NOT NULL,
      unit          TEXT DEFAULT 'kg',
      current_value NUMERIC DEFAULT 0,
      deadline      TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS nutrition_logs (
      id         SERIAL PRIMARY KEY,
      date       TEXT NOT NULL,
      meal       TEXT NOT NULL,
      protein_g  INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("init error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
