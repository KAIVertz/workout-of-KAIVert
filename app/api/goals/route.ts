import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const goals = await sql`SELECT * FROM goals ORDER BY created_at DESC`;
    return NextResponse.json(goals);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { label, target_value, unit, deadline } = await req.json() as { label: string; target_value: number; unit: string; deadline?: string };
    const sql = getDb();
    const rows = await sql`
      INSERT INTO goals (label, target_value, unit, deadline)
      VALUES (${label}, ${target_value}, ${unit ?? "kg"}, ${deadline ?? null})
      RETURNING *
    ` as Record<string, unknown>[];
    return NextResponse.json(rows[0]);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, current_value } = await req.json() as { id: number; current_value: number };
    const sql = getDb();
    await sql`UPDATE goals SET current_value=${current_value} WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: number };
    const sql = getDb();
    await sql`DELETE FROM goals WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
