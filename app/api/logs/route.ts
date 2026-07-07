import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { session_id, exercise_name, set_number, reps, weight_kg, flag = null } = await req.json();
    const sql = getDb();
    await sql`
      INSERT INTO exercise_logs (session_id, exercise_name, set_number, reps, weight_kg, flag)
      VALUES (${session_id}, ${exercise_name}, ${set_number}, ${reps}, ${weight_kg}, ${flag})
      ON CONFLICT (session_id, exercise_name, set_number)
      DO UPDATE SET reps = EXCLUDED.reps, weight_kg = EXCLUDED.weight_kg, flag = EXCLUDED.flag`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session_id, exercise_name, set_number, flag } = await req.json();
    const sql = getDb();
    await sql`
      UPDATE exercise_logs SET flag = ${flag ?? null}
      WHERE session_id = ${session_id}
        AND exercise_name = ${exercise_name}
        AND set_number = ${set_number}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const session_id = url.searchParams.get("session_id");
    const exercise_name = url.searchParams.get("exercise_name");
    const set_number = url.searchParams.get("set_number");
    if (!session_id || !exercise_name || !set_number) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }
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
