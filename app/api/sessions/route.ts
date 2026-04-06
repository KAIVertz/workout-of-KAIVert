import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { DayType } from "@/lib/program";

export async function GET() {
  try {
    const sql = getDb();
    const sessions = await sql`
      SELECT id, date, day_type, completed, created_at
      FROM workout_sessions
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json(sessions);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { day_type }: { day_type: DayType } = await req.json();
    const sql = getDb();
    const today = new Date().toISOString().split("T")[0];

    const existing = await sql`
      SELECT id FROM workout_sessions WHERE date = ${today} AND day_type = ${day_type}
    `;
    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    const result = await sql`
      INSERT INTO workout_sessions (date, day_type)
      VALUES (${today}, ${day_type})
      RETURNING id, date, day_type, completed
    `;
    return NextResponse.json(result[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
