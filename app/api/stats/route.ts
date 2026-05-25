import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        el.exercise_name,
        MAX(el.weight_kg)::float  AS max_weight,
        MAX(el.reps)              AS best_reps
      FROM exercise_logs el
      JOIN workout_sessions ws ON el.session_id = ws.id
      WHERE ws.completed = true AND el.weight_kg > 0 AND el.set_number > 0
      GROUP BY el.exercise_name
      ORDER BY el.exercise_name
    `;
    return NextResponse.json({ records: rows });
  } catch (e) {
    return NextResponse.json({ records: [], error: String(e) });
  }
}
