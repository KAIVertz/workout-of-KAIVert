import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT ws.date, el.exercise_name,
             MAX(el.weight_kg)::float AS max_weight,
             MAX(el.reps)             AS max_reps
      FROM exercise_logs el
      JOIN workout_sessions ws ON el.session_id = ws.id
      WHERE ws.completed = true AND el.set_number > 0 AND el.weight_kg > 0
      GROUP BY ws.date, el.exercise_name
      ORDER BY el.exercise_name, ws.date
    ` as { date: string; exercise_name: string; max_weight: number; max_reps: number }[];

    const result: Record<string, { date: string; weight: number; reps: number }[]> = {};
    for (const row of rows) {
      if (!result[row.exercise_name]) result[row.exercise_name] = [];
      result[row.exercise_name].push({ date: row.date, weight: row.max_weight, reps: row.max_reps });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({}, { status: 500, statusText: String(e) });
  }
}
