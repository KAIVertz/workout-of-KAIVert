import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const date = req.nextUrl.searchParams.get("date");
    if (date) {
      const logs = await sql`SELECT * FROM nutrition_logs WHERE date = ${date} ORDER BY created_at`;
      return NextResponse.json(logs);
    }
    const rows = await sql`
      SELECT date, SUM(protein_g)::int AS total_protein
      FROM nutrition_logs
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `;
    return NextResponse.json(rows);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { date, meal, protein_g } = await req.json() as { date: string; meal: string; protein_g: number };
    const sql = getDb();
    const rows = await sql`
      INSERT INTO nutrition_logs (date, meal, protein_g) VALUES (${date}, ${meal}, ${protein_g}) RETURNING *
    ` as Record<string, unknown>[];
    return NextResponse.json(rows[0]);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: number };
    const sql = getDb();
    await sql`DELETE FROM nutrition_logs WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
