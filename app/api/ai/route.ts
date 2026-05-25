import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PROGRAM, DAY_LABEL, WEEKLY_SCHEDULE, DayType } from "@/lib/program";
import { getDb } from "@/lib/db";

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
}

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const PROGRAM_TEXT = Object.entries(WEEKLY_SCHEDULE)
  .map(([day, type]) => {
    const exs = PROGRAM[type as DayType].map(e => `${e.name} ${e.sets}×${e.reps} (${e.weight})`).join(", ");
    return `${DAY_NAMES[Number(day)]} — ${DAY_LABEL[type as DayType].label} : ${exs}`;
  }).join("\n");

const BASE_SYSTEM = `Tu es ARIA, l'IA sportive et médicale personnelle de KAI.
Tu réunis en toi un coach de force, un kinésithérapeute, un nutritionniste végane et un préparateur mental.

═══ PROFIL KAI ═══
Âge : 15 ans | Poids : 54 kg | Taille : 164 cm
Régime : végane (aucun produit animal)
Équipement : haltères 5 kg, 7 kg, 13 kg — entraînement en chambre
Objectif : prise de masse propre, définition, force

═══ BLESSURES EN COURS ═══
• Hématome cuisse gauche — douleur à la pression et à la contraction. Éviter tout appui ou charge sur la cuisse gauche.
• Douleur genou droit — flexion légère douloureuse (probable tendon rotulien). Squats, fentes, soulevé de terre, wall sit supprimés.
→ Jours jambes remplacés par exercices bras + mollets (programme déjà adapté)

═══ PROGRAMME ACTUEL ═══
${PROGRAM_TEXT}

═══ DIRECTIVES ═══
• Réponds en français, tutoiement, ton direct et bienveillant — comme un vrai coach qui te connaît bien
• Utilise TOUJOURS le contexte récent (check-in + historique) pour personnaliser chaque réponse
• Si énergie ≤ 2 → propose de réduire le volume (-1 série par exercice)
• Si douleur dans une zone → adapte ou remplace l'exercice ciblant cette zone
• Tu peux et dois proposer des adaptations concrètes : exercices, séries, reps, poids
• Sois précis et utile, 2-4 phrases max sauf si analyse détaillée demandée
• Jamais d'emojis`;

interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }
interface Message { role: "user" | "assistant"; content: string; }

async function getLastCheckin() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT dc.*,
        json_agg(json_build_object('zone', pl.zone, 'intensity', pl.intensity))
          FILTER (WHERE pl.id IS NOT NULL) as pain_zones
      FROM daily_checkins dc
      LEFT JOIN pain_logs pl ON pl.checkin_id = dc.id
      GROUP BY dc.id
      ORDER BY dc.date DESC
      LIMIT 1
    `;
    return (rows as Record<string, unknown>[])[0] ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, context } = (await req.json()) as {
      message: string;
      history: Message[];
      context: { sessions?: Session[]; rolePrompt?: string };
    };

    // Fetch last check-in from DB for live context
    const lastCheckin = await getLastCheckin();

    // Build recent sessions context
    const sessions = (context?.sessions ?? []).filter(s => s.completed).slice(0, 10);
    const sessionCtx = sessions.length
      ? sessions.map(s => {
          const d = new Date(s.date + "T12:00:00");
          const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
          const info = DAY_LABEL[s.day_type as DayType];
          return `- ${label} : ${info?.label ?? s.day_type}${s.duration_seconds ? ` (${Math.round(s.duration_seconds / 60)}min)` : ""}`;
        }).join("\n")
      : "Aucune séance encore";

    // Build check-in context
    let checkinCtx = "Pas de check-in aujourd'hui";
    if (lastCheckin) {
      const ci = lastCheckin as Record<string, unknown>;
      const pains = Array.isArray(ci.pain_zones) && ci.pain_zones.length
        ? ` | Douleurs : ${(ci.pain_zones as { zone: string; intensity: number }[]).map(p => `${p.zone} (${["légère","modérée","forte"][p.intensity - 1]})`).join(", ")}`
        : "";
      checkinCtx = `Date : ${ci.date} | Énergie : ${ci.energy}/5 | Sommeil : ${ci.sleep_hours}h qualité ${ci.sleep_quality}/5 | Humeur : ${ci.mood}/5${pains}`;
    }

    const systemContent = BASE_SYSTEM +
      `\n\n═══ HISTORIQUE RÉCENT ═══\n${sessionCtx}` +
      `\n\n═══ DERNIER CHECK-IN ═══\n${checkinCtx}` +
      (context?.rolePrompt ? `\n\n═══ MODE ACTIF ═══\n${context.rolePrompt}` : "");

    const stream = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 600,
      messages: [
        { role: "system", content: systemContent },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
