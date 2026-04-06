import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    // Max weight per exercise per session date
    const rows = await sql`
      SELECT
        ws.date,
        ws.day_type,
        el.exercise_name,
        MAX(el.weight_kg) AS max_weight,
        MAX(el.reps) AS max_reps
      FROM exercise_logs el
      JOIN workout_sessions ws ON el.session_id = ws.id
      WHERE ws.completed = true
      GROUP BY ws.date, ws.day_type, el.exercise_name
      ORDER BY ws.date ASC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
