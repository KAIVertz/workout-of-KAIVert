import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM workout_sessions ORDER BY date DESC, id DESC LIMIT 200`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { day_type } = await req.json();
  const sql = getDb();
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const result = await sql`
    INSERT INTO workout_sessions (date, day_type)
    VALUES (${date}, ${day_type})
    RETURNING *`;
  return NextResponse.json((result as Record<string, unknown>[])[0]);
}
