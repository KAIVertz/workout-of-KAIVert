import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sql = getDb();
  await sql`DELETE FROM exercise_logs WHERE session_id=${body.session_id} AND exercise_name=${body.exercise_name} AND set_number=${body.set_number}`;
  const r = await sql`INSERT INTO exercise_logs (session_id,exercise_name,set_number,reps,weight_kg) VALUES (${body.session_id},${body.exercise_name},${body.set_number},${body.reps},${body.weight_kg}) RETURNING id`;
  return NextResponse.json((r as Record<string, unknown>[])[0]);
}

export async function DELETE(req: NextRequest) {
  const { session_id, exercise_name, set_number } = await req.json();
  const sql = getDb();
  await sql`DELETE FROM exercise_logs WHERE session_id=${session_id} AND exercise_name=${exercise_name} AND set_number=${set_number}`;
  return NextResponse.json({ ok: true });
}
