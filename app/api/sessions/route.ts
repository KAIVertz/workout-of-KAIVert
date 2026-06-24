import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM workout_sessions ORDER BY date DESC, id DESC LIMIT 100`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { day_type, date } = await req.json(); // date comes from client (local date)
    const sql = getDb();
    const result = await sql`
      INSERT INTO workout_sessions (date, day_type)
      VALUES (${date}, ${day_type})
      RETURNING *`;
    return NextResponse.json((result as Record<string, unknown>[])[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
