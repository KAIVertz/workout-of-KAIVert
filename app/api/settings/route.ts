import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT key, value FROM user_settings` as { key: string; value: string }[];
    const result: Record<string, string> = {};
    for (const r of rows) result[r.key] = r.value;
    return NextResponse.json(result);
  } catch { return NextResponse.json({}); }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    const sql = getDb();
    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO user_settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
