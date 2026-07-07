import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  const logs = await sql`SELECT exercise_name, set_number, reps, weight_kg, flag FROM exercise_logs WHERE session_id = ${id} ORDER BY exercise_name, set_number`;
  return NextResponse.json(logs);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { completed?: boolean; duration_seconds?: number; notes?: string };
  const sql = getDb();
  try {
    const dur = body.duration_seconds && body.duration_seconds > 0 ? body.duration_seconds : null;
    await sql`
      UPDATE workout_sessions SET
        completed       = COALESCE(${body.completed ?? null}, completed),
        duration_seconds = COALESCE(${dur}, duration_seconds),
        notes           = COALESCE(${body.notes ?? null}, notes)
      WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM workout_sessions WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
