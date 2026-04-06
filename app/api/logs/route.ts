import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body: {
      session_id: number;
      exercise_name: string;
      set_number: number;
      reps: number;
      weight_kg: number;
    } = await req.json();

    const sql = getDb();

    // Upsert: delete existing log for this session+exercise+set, then insert
    await sql`
      DELETE FROM exercise_logs
      WHERE session_id = ${body.session_id}
        AND exercise_name = ${body.exercise_name}
        AND set_number = ${body.set_number}
    `;

    const result = await sql`
      INSERT INTO exercise_logs (session_id, exercise_name, set_number, reps, weight_kg)
      VALUES (${body.session_id}, ${body.exercise_name}, ${body.set_number}, ${body.reps}, ${body.weight_kg})
      RETURNING id
    `;
    return NextResponse.json(result[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exercise = searchParams.get("exercise");
    const sql = getDb();

    if (exercise) {
      // Get last 10 sessions for this exercise to show progress
      const rows = await sql`
        SELECT
          ws.date,
          el.set_number,
          el.reps,
          el.weight_kg
        FROM exercise_logs el
        JOIN workout_sessions ws ON el.session_id = ws.id
        WHERE el.exercise_name = ${exercise}
        ORDER BY ws.date DESC, el.set_number ASC
        LIMIT 60
      `;
      return NextResponse.json(rows);
    }

    return NextResponse.json([]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
