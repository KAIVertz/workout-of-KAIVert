import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { session_id, exercise_name, set_number, reps, weight_kg } = await req.json();
    const sql = getDb();
    // True upsert — safe under concurrent taps
    await sql`
      INSERT INTO exercise_logs (session_id, exercise_name, set_number, reps, weight_kg)
      VALUES (${session_id}, ${exercise_name}, ${set_number}, ${reps}, ${weight_kg})
      ON CONFLICT (session_id, exercise_name, set_number)
      DO UPDATE SET reps = EXCLUDED.reps, weight_kg = EXCLUDED.weight_kg`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session_id, exercise_name, set_number } = await req.json();
    const sql = getDb();
    await sql`
      DELETE FROM exercise_logs
      WHERE session_id = ${session_id}
        AND exercise_name = ${exercise_name}
        AND set_number = ${set_number}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
