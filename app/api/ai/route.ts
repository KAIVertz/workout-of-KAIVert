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
Tu connais les recherches de Bryan Johnson, Peter Attia et les dernières études sur la musculation adolescente.

═══ PROFIL KAI ═══
Âge : 15 ans | Poids : 54 kg | Taille : 164 cm
Régime : végane (aucun produit animal)
Équipement : haltères 5 kg, 7 kg, 13 kg — entraînement en chambre
Objectif principal : prise de masse propre + définition + force

═══ BLESSURES EN COURS ═══
• Hématome cuisse gauche — éviter tout appui ou charge sur la cuisse gauche.
• Douleur genou droit — flexion légère douloureuse (probable tendon rotulien). Squats, fentes, soulevé de terre supprimés.
→ Jours jambes remplacés par exercices bras + mollets (programme déjà adapté)

═══ PROGRAMME ACTUEL ═══
${PROGRAM_TEXT}

═══ PRINCIPES DE PROGRESSION (Bryan Johnson / surcharge progressive) ═══
• Surcharge progressive : augmenter poids ou reps chaque semaine (+0.5kg ou +1 rep). C'est la seule façon de progresser.
• KAI peut désormais logger le poids réel utilisé par exercice — surveille ses charges et signale quand progresser.
• Zone 2 optionnelle : marche 10min après les repas = méthode la plus simple pour santé métabolique.
• Mobilité 5-10min/jour : hanches, épaules, chevilles. Critique à 15 ans pour éviter les blessures futures.
• Équilibre : exercice sur une jambe les yeux fermés — indicateur neurologique. Suggère 30s/côté après chaque séance.
• La force musculaire est le meilleur indicateur de longévité : prioriser les mouvements polyarticulaires.

═══ DIRECTIVES ═══
• Réponds en français, tutoiement, ton direct et bienveillant — comme un vrai coach qui te connaît bien
• Utilise TOUJOURS le contexte récent (check-in + historique + charges loggées) pour personnaliser
• Si énergie ≤ 2 → propose de réduire le volume (-1 série par exercice)
• Si douleur dans une zone → adapte ou remplace l'exercice ciblant cette zone
• Si KAI n'a pas progressé en poids depuis 2+ séances sur un exercice → suggère d'augmenter la charge
• Pour modifier le programme : formule ainsi "MODIFICATION → [exercice] : sets=[N], weight=[X]kg" pour que l'app puisse le détecter
• Pour ajouter un exercice : "AJOUT → [Nom] : sets=[N], reps=[X ou Xs], muscle=[zone]" — ajoute ", permanent=oui" si l'exercice doit rester dans le programme, sinon permanent=non par défaut
• Sois précis et utile, 2-4 phrases max sauf si analyse détaillée demandée
• Jamais d'emojis

═══ RÈGLES ANALYSE SÉANCES ═══
• Séance manquée → augmente les séries des exercices principaux avec MODIFICATION (+1 à +2 séries)
• Exercices non terminés → 1 phrase d'analyse + conseil, pas de modification automatique
• Étirements Bryan Johnson recommandés en fin de séance (30-60s chaque) : planche, étirement épaules croisées, mobilité hanches — suggère avec AJOUT, permanent=non
• Progressions stagnantes (même charge 2+ séances) → suggère augmentation +0.5kg via MODIFICATION weight=`;

interface Session { id: number; date: string; day_type: string; completed: boolean; duration_seconds?: number; }
interface Message { role: "user" | "assistant"; content: string; }

async function getIncompleteExercises() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT ws.id, ws.day_type, ws.date::text as date,
             el.exercise_name,
             COUNT(el.id)::int as sets_done
      FROM workout_sessions ws
      LEFT JOIN exercise_logs el ON el.session_id = ws.id AND el.set_number > 0
      WHERE ws.completed = true
      GROUP BY ws.id, ws.day_type, ws.date, el.exercise_name
      ORDER BY ws.date DESC
      LIMIT 80
    `;
    const sessMap = new Map<number, { date: string; day_type: string; exMap: Map<string, number> }>();
    for (const r of rows as { id: number; day_type: string; date: string; exercise_name: string | null; sets_done: number }[]) {
      if (!sessMap.has(r.id)) sessMap.set(r.id, { date: String(r.date).slice(0, 10), day_type: r.day_type, exMap: new Map() });
      if (r.exercise_name) sessMap.get(r.id)!.exMap.set(r.exercise_name, r.sets_done);
    }
    const lines: string[] = [];
    let count = 0;
    for (const [, sess] of sessMap) {
      if (count >= 5) break;
      const expected = PROGRAM[sess.day_type as DayType];
      if (!expected) { count++; continue; }
      const incomplete = expected.filter(ex => (sess.exMap.get(ex.name) ?? 0) < ex.sets);
      if (incomplete.length) {
        const info = DAY_LABEL[sess.day_type as DayType];
        lines.push(`${sess.date} (${info?.label ?? sess.day_type}) : ${incomplete.map(ex => `${ex.name} ${sess.exMap.get(ex.name) ?? 0}/${ex.sets} séries`).join(", ")}`);
      }
      count++;
    }
    return lines.length ? lines.join("\n") : null;
  } catch { return null; }
}

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

async function getRecentNotes() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT date, notes FROM workout_sessions
      WHERE completed = true AND notes IS NOT NULL AND notes != ''
      ORDER BY date DESC LIMIT 5
    ` as { date: string; notes: string }[];
    return rows.length ? rows.map(r => `${String(r.date).slice(5)}: ${r.notes}`).join("\n") : null;
  } catch { return null; }
}

async function getNutritionAvg() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT date, SUM(protein_g)::int AS total FROM nutrition_logs
      GROUP BY date ORDER BY date DESC LIMIT 7
    ` as { date: string; total: number }[];
    if (!rows.length) return null;
    const avg = Math.round(rows.reduce((a, r) => a + Number(r.total), 0) / rows.length);
    const latest = rows[0];
    return `Moyenne 7j: ${avg}g/j (objectif 90g/j)${latest ? ` | Dernier jour: ${latest.total}g` : ""}`;
  } catch { return null; }
}

async function getRecentWeights() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT el.exercise_name,
             MAX(el.weight_kg) as max_weight,
             MAX(el.reps) as max_reps,
             ws.date
      FROM exercise_logs el
      JOIN workout_sessions ws ON ws.id = el.session_id
      WHERE ws.completed = true AND el.weight_kg > 0 AND el.set_number > 0
      GROUP BY el.exercise_name, ws.date
      ORDER BY ws.date DESC
      LIMIT 30
    `;
    // Group by exercise, keep last 3 sessions per exercise
    const byEx: Record<string, { date: string; weight: number; reps: number }[]> = {};
    for (const r of rows as { exercise_name: string; max_weight: number; max_reps: number; date: string }[]) {
      if (!byEx[r.exercise_name]) byEx[r.exercise_name] = [];
      if (byEx[r.exercise_name].length < 3) {
        byEx[r.exercise_name].push({ date: String(r.date).slice(0, 10), weight: Number(r.max_weight), reps: r.max_reps });
      }
    }
    return byEx;
  } catch { return {}; }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, context } = (await req.json()) as {
      message: string;
      history: Message[];
      context: { sessions?: Session[]; rolePrompt?: string };
    };

    const [lastCheckin, recentWeights, incompleteExercises, recentNotes, nutritionAvg] = await Promise.all([
      getLastCheckin(), getRecentWeights(), getIncompleteExercises(), getRecentNotes(), getNutritionAvg(),
    ]);

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

    // Build recent weights context
    const weightsCtx = Object.keys(recentWeights).length
      ? Object.entries(recentWeights).map(([ex, data]) => {
          const pts = data.map(d => `${d.date.slice(5)}: ${d.weight}kg×${d.reps}`).join(" → ");
          return `${ex}: ${pts}`;
        }).join("\n")
      : "Aucune charge enregistrée encore";

    // Auto-progression candidates: same weight 2+ consecutive sessions
    const progressionCandidates = Object.entries(recentWeights)
      .filter(([, data]) => data.length >= 2 && data[0].weight > 0 && data[0].weight === data[1].weight)
      .map(([ex, data]) => `${ex}: ${data[0].weight}kg × ${data.length} séances → AUGMENTER`);

    const systemContent = BASE_SYSTEM +
      `\n\n═══ HISTORIQUE RÉCENT ═══\n${sessionCtx}` +
      `\n\n═══ DERNIER CHECK-IN ═══\n${checkinCtx}` +
      `\n\n═══ CHARGES RÉCENTES PAR EXERCICE ═══\n${weightsCtx}` +
      (progressionCandidates.length ? `\n\n═══ PROGRESSIONS AUTO-DÉTECTÉES ═══\n${progressionCandidates.join("\n")}\n→ Pour chacun, formule un MODIFICATION automatiquement.` : "") +
      (incompleteExercises ? `\n\n═══ EXERCICES NON TERMINÉS (séances passées) ═══\n${incompleteExercises}` : "") +
      (recentNotes ? `\n\n═══ NOTES POST-SÉANCE ═══\n${recentNotes}` : "") +
      (nutritionAvg ? `\n\n═══ PROTÉINES ═══\n${nutritionAvg}` : "") +
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
