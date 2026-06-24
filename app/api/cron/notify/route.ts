import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getDb } from "@/lib/db";

function localDateStr(date = new Date()) {
  return date.toLocaleDateString("fr-CA"); // YYYY-MM-DD in local time
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(
    "mailto:aidentoutain28@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  try {
    const sql = getDb();
    const subs = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions` as { endpoint: string; p256dh: string; auth: string }[];
    if (!subs.length) return NextResponse.json({ sent: 0 });

    const type = req.nextUrl.searchParams.get("type") ?? "reminder";
    const todayStr = localDateStr();

    // For streak-danger, check if there's already a session today
    if (type === "streak") {
      const rows = await sql`
        SELECT id FROM workout_sessions
        WHERE date = ${todayStr} AND completed = true LIMIT 1
      ` as { id: number }[];
      if (rows.length > 0) return NextResponse.json({ sent: 0, reason: "already trained" });
    }

    // Custom daily reminder at user-configured hour (Paris time)
    if (type === "custom") {
      const settingsRows = await sql`SELECT value FROM user_settings WHERE key = 'reminder_hour'` as { value: string }[];
      if (!settingsRows.length) return NextResponse.json({ sent: 0, reason: "no reminder set" });
      const preferredHour = parseInt(settingsRows[0].value);
      const parisHour = parseInt(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris", hour: "numeric", hour12: false }));
      if (parisHour !== preferredHour) return NextResponse.json({ sent: 0, reason: `not time yet (${parisHour} vs ${preferredHour})` });
      // Don't send if already trained today
      const todayRows = await sql`SELECT id FROM workout_sessions WHERE date = ${todayStr} AND completed = true LIMIT 1` as { id: number }[];
      if (todayRows.length) return NextResponse.json({ sent: 0, reason: "already trained" });
    }

    const messages: Record<string, { title: string; body: string; tag: string }> = {
      reminder: { title: "KAIVert", body: "Ta séance t'attend — prêt à attaquer ?", tag: "reminder" },
      streak: { title: "Streak en danger", body: "Tu n'as pas encore fait ta séance aujourd'hui. Ne brise pas ta série !", tag: "streak" },
      custom: { title: "KAIVert — Séance du jour", body: "C'est l'heure de t'entraîner. ARIA t'attend.", tag: "custom-reminder" },
    };
    const payload = messages[type] ?? messages.reminder;

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth as string } },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: unknown) {
        // Remove expired/invalid subscriptions
        if ((err as { statusCode?: number }).statusCode === 410) {
          await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
        }
      }
    }
    return NextResponse.json({ sent });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
