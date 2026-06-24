import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT exercise_name, sets, weight FROM program_overrides` as
      { exercise_name: string; sets: number | null; weight: string | null }[];
    const result: Record<string, { sets?: number; weight?: string }> = {};
    for (const r of rows) {
      result[r.exercise_name] = {};
      if (r.sets != null) result[r.exercise_name].sets = r.sets;
      if (r.weight != null) result[r.exercise_name].weight = r.weight;
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({}, { status: 500, statusText: String(e) });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { exercise_name, sets, weight } = await req.json() as
      { exercise_name: string; sets?: number; weight?: string };
    const sql = getDb();
    await sql`
      INSERT INTO program_overrides (exercise_name, sets, weight)
      VALUES (${exercise_name}, ${sets ?? null}, ${weight ?? null})
      ON CONFLICT (exercise_name) DO UPDATE
        SET sets = COALESCE(EXCLUDED.sets, program_overrides.sets),
            weight = COALESCE(EXCLUDED.weight, program_overrides.weight),
            updated_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { exercise_name } = await req.json() as { exercise_name: string };
    const sql = getDb();
    await sql`DELETE FROM program_overrides WHERE exercise_name = ${exercise_name}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
