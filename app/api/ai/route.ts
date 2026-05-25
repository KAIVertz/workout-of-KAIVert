import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PROGRAM, DAY_LABEL, WEEKLY_SCHEDULE, DayType } from "@/lib/program";

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
}

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const SYSTEM_PROMPT =
  `Tu es KAI Coach, un coach sportif IA personnalisé pour KAI.

Profil :
- KAI, 15 ans, 54 kg, 164 cm, végane
- Équipement : haltères maison uniquement (5 kg, 7 kg, 13 kg)
- Blessures actuelles :
  * Hématome cuisse gauche — douleur à la pression. Éviter poids posé sur la cuisse gauche.
  * Douleur genou droit (tennis de table) — même légères flexions font mal. Squats, fentes, wall sit, soulevé de terre supprimés.
  * Programme adapté : mercredi (Bras+) et samedi (Chest+) remplacent les jours jambes.

Programme 7 jours :
` +
  Object.entries(WEEKLY_SCHEDULE)
    .map(([day, type]) => {
      const exercises = PROGRAM[type as DayType].map((e) => e.name).join(", ");
      return `${DAY_NAMES[Number(day)]} — ${DAY_LABEL[type as DayType].label} : ${exercises}`;
    })
    .join("\n") +
  `

Règles :
- Réponds toujours en français, tutoie KAI
- Sois direct et coach, pas trop formel
- Respecte STRICTEMENT les blessures actuelles dans tous tes conseils
- Nutrition = toujours végane
- Concis sauf si une analyse détaillée est demandée
- Pour les progressions, base-toi sur les données de séances fournies`;

interface Session {
  id: number;
  date: string;
  day_type: string;
  completed: boolean;
  duration_seconds: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, context } = (await req.json()) as {
      message: string;
      history: Message[];
      context: { sessions: Session[] };
    };

    const sessionSummary = context?.sessions?.length
      ? `\nDernières séances (${context.sessions.length}) :\n` +
        context.sessions
          .map(
            (s) =>
              `- ${s.date} : ${s.day_type}${s.completed ? " ✓" : " (interrompue)"}${s.duration_seconds ? ` ${Math.round(s.duration_seconds / 60)}min` : ""}`
          )
          .join("\n")
      : "";

    const stream = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + sessionSummary },
        ...history.map((m) => ({ role: m.role, content: m.content })),
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

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
