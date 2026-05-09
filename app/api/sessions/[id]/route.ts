import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const logs = await sql`SELECT exercise_name, set_number, reps, weight_kg FROM exercise_logs WHERE session_id = ${id} ORDER BY exercise_name, set_number`;
  return NextResponse.json(logs);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { completed, duration_seconds } = await req.json();
  const sql = getDb();
  await sql`UPDATE workout_sessions SET completed=${completed}, duration_seconds=COALESCE(${duration_seconds??null},duration_seconds) WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM workout_sessions WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
