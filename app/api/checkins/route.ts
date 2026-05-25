import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (date) {
      const rows = await sql`
        SELECT c.*, json_agg(json_build_object('zone', p.zone, 'intensity', p.intensity)) FILTER (WHERE p.id IS NOT NULL) AS pain_zones
        FROM daily_checkins c
        LEFT JOIN pain_logs p ON p.checkin_id = c.id
        WHERE c.date = ${date}
        GROUP BY c.id`;
      return NextResponse.json((rows as Record<string, unknown>[])[0] ?? null);
    }
    const rows = await sql`
      SELECT c.*, json_agg(json_build_object('zone', p.zone, 'intensity', p.intensity)) FILTER (WHERE p.id IS NOT NULL) AS pain_zones
      FROM daily_checkins c
      LEFT JOIN pain_logs p ON p.checkin_id = c.id
      GROUP BY c.id
      ORDER BY c.date DESC
      LIMIT 30`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, energy, sleep_hours, sleep_quality, mood, notes, pain_zones } = await req.json();
    const sql = getDb();

    const result = await sql`
      INSERT INTO daily_checkins (date, energy, sleep_hours, sleep_quality, mood, notes)
      VALUES (${date}, ${energy}, ${sleep_hours}, ${sleep_quality}, ${mood}, ${notes ?? null})
      ON CONFLICT (date) DO UPDATE SET
        energy = EXCLUDED.energy,
        sleep_hours = EXCLUDED.sleep_hours,
        sleep_quality = EXCLUDED.sleep_quality,
        mood = EXCLUDED.mood,
        notes = EXCLUDED.notes
      RETURNING *`;

    const checkin = (result as Record<string, unknown>[])[0];
    const checkinId = (checkin as { id: number }).id;

    if (pain_zones && pain_zones.length > 0) {
      await sql`DELETE FROM pain_logs WHERE checkin_id = ${checkinId}`;
      for (const pz of pain_zones) {
        await sql`
          INSERT INTO pain_logs (checkin_id, zone, intensity)
          VALUES (${checkinId}, ${pz.zone}, ${pz.intensity})`;
      }
    }

    return NextResponse.json(checkin);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
