"use client";
import { useState } from "react";
import { BodyMap } from "./BodyMap";
import { localDate } from "@/lib/program";

interface CheckinData {
  energy: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  mood: 1 | 2 | 3 | 4 | 5;
  bodyWeight: number | null;
  painZones: Record<string, 0 | 1 | 2 | 3>;
}

const ENERGY_LABELS = ["Épuisé", "Fatigué", "Normal", "Chargé", "En feu"];
const MOOD_LABELS   = ["Stressé", "Fatigué", "Neutre", "Serein", "Motivé"];
const SLEEP_OPTIONS = [5, 6, 7, 8, 9];
const ACCENT = "#0041C2";
function LevelBar({ value, max = 5, onChange, labels, accent = ACCENT }: {
  value: number; max?: number; onChange: (v: number) => void; labels?: string[]; accent?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map((v) => (
          <button key={v} onClick={() => onChange(v)}
            style={{
              flex: 1, height: 44, borderRadius: 10, border: "none",
              background: v <= value ? accent : "#10101a",
              outline: v === value ? `2px solid ${accent}` : "1px solid #1a1a2e",
              outlineOffset: v === value ? 2 : 0,
              cursor: "pointer", transition: "all 0.12s",
              opacity: v <= value ? 1 : 0.35 + (v / max) * 0.2,
              boxShadow: v === value ? `0 0 12px ${accent}55` : "none",
            }}
          />
        ))}
      </div>
      {labels && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#374151" }}>{labels[0]}</span>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{labels[value - 1]}</span>
          <span style={{ fontSize: 12, color: "#374151" }}>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

const STEPS = ["Énergie", "Sommeil", "Humeur", "Poids", "Douleurs"];

export function CheckinModal({ onClose }: { onClose: () => void }) {
  const isMonday = new Date().getDay() === 1;
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CheckinData>({
    energy: 3, sleepHours: 7, sleepQuality: 3, mood: 3, bodyWeight: null, painZones: {},
  });
  const [saving, setSaving] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setSaving(true);
    const painArr = Object.entries(data.painZones)
      .filter(([, v]) => v > 0)
      .map(([zone, intensity]) => ({ zone, intensity }));

    try {
      await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: localDate(),
          energy: data.energy,
          sleep_hours: data.sleepHours,
          sleep_quality: data.sleepQuality,
          mood: data.mood,
          body_weight: data.bodyWeight ?? null,
          pain_zones: painArr,
        }),
      });

      const painSummary = painArr.length
        ? `Douleurs : ${painArr.map(p => `${p.zone} (${["","légère","modérée","forte"][p.intensity]})`).join(", ")}.`
        : "Pas de douleurs.";
      const weightNote = data.bodyWeight ? `Poids : ${data.bodyWeight} kg.` : "";

      const isWeeklyReview = isMonday;
      const msg = isWeeklyReview
        ? `C'est lundi — bilan de la semaine. Check-in : énergie ${data.energy}/5, sommeil ${data.sleepHours}h qualité ${data.sleepQuality}/5, humeur ${data.mood}/5. ${weightNote} ${painSummary} Fais-moi un bilan complet de la semaine passée : séances, progression, récup, et 2 objectifs pour cette semaine.`
        : `Check-in matin : énergie ${data.energy}/5, sommeil ${data.sleepHours}h qualité ${data.sleepQuality}/5, humeur ${data.mood}/5. ${weightNote} ${painSummary} Brief de la journée en 2-3 lignes max.`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: [], context: {} }),
      });

      if (res.ok) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let text = "";
        setDone(true);
        while (true) {
          const { done: d, value } = await reader.read();
          if (d) break;
          text += decoder.decode(value, { stream: true });
          setAiMessage(text);
        }
      } else { setDone(true); }
    } catch {
      setDone(true);
      setAiMessage("Check-in enregistré. Bonne séance !");
    } finally { setSaving(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, background: "#08080d",
      display: "flex", flexDirection: "column",
      paddingTop: "max(56px, calc(env(safe-area-inset-top) + 24px))",
      paddingLeft: 24, paddingRight: 24,
      paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 16px))",
      overflowY: "auto",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 80% 45% at 50% 0%, ${ACCENT}12 0%, transparent 60%)` }} />

      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Check-in · {isMonday ? "Lundi — Bilan semaine" : "Matin"}
            </p>
            {!done && (
              <p className="font-racing" style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", color: "#fff", marginTop: 4, lineHeight: 1 }}>
                {STEPS[step]}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#374151", fontSize: 26, cursor: "pointer", lineHeight: 1, paddingTop: 2 }}>×</button>
        </div>

        {/* Progress bar */}
        {!done && (
          <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= step ? ACCENT : "#1a1a2e", boxShadow: i === step ? `0 0 8px ${ACCENT}88` : "none", transition: "background 0.2s" }} />
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {done ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <p className="font-racing" style={{ fontSize: 38, fontWeight: 900, fontStyle: "italic", color: "#fff", lineHeight: 1 }}>Bonjour KAI</p>
                <p style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>Check-in enregistré</p>
              </div>
              {aiMessage ? (
                <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20, padding: "18px 20px", flex: 1 }}>
                  <p className="font-racing" style={{ fontSize: 12, fontWeight: 700, fontStyle: "italic", color: ACCENT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                    {isMonday ? "Bilan semaine · ARIA" : "Brief du coach"}
                  </p>
                  <p style={{ fontSize: 15, color: "#e5e7eb", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiMessage}</p>
                </div>
              ) : (
                <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 20, padding: "18px 20px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "#374151", fontSize: 13 }}>{saving ? "Analyse en cours…" : ""}</p>
                </div>
              )}
              <button onClick={onClose}
                style={{ padding: "19px 0", borderRadius: 18, border: "none", background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-barlow), system-ui", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: `0 0 24px ${ACCENT}44` }}>
                C'est parti
              </button>
            </div>

          ) : step === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Comment tu te sens physiquement ?</p>
              <LevelBar value={data.energy} onChange={v => setData(d => ({ ...d, energy: v as CheckinData["energy"] }))} labels={ENERGY_LABELS} />
            </div>

          ) : step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Heures de sommeil</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {SLEEP_OPTIONS.map(h => (
                    <button key={h} onClick={() => setData(d => ({ ...d, sleepHours: h }))}
                      style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: data.sleepHours === h ? `2px solid ${ACCENT}` : "1px solid #1a1a2e", background: data.sleepHours === h ? `${ACCENT}22` : "#10101a", color: data.sleepHours === h ? "#fff" : "#6b7280", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.12s", boxShadow: data.sleepHours === h ? `0 0 12px ${ACCENT}44` : "none" }}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Qualité du sommeil</p>
                <LevelBar value={data.sleepQuality} onChange={v => setData(d => ({ ...d, sleepQuality: v as CheckinData["sleepQuality"] }))} labels={["Très mauvaise", "Mauvaise", "Correcte", "Bonne", "Excellente"]} />
              </div>
            </div>

          ) : step === 2 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Comment tu te sens mentalement ?</p>
              <LevelBar value={data.mood} onChange={v => setData(d => ({ ...d, mood: v as CheckinData["mood"] }))} labels={MOOD_LABELS} />
            </div>

          ) : step === 3 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 13, color: "#6b7280" }}>Ton poids ce matin (optionnel)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#0a0a14", borderRadius: 18, border: "1px solid #1a1a2e", overflow: "hidden" }}>
                <button onClick={() => setData(d => ({ ...d, bodyWeight: Math.max(30, Math.round(((d.bodyWeight ?? 54) - 0.5) * 2) / 2) }))}
                  style={{ width: 60, height: 72, background: "none", border: "none", color: "#6b7280", fontSize: 26, cursor: "pointer", flexShrink: 0 }}>−</button>
                <div style={{ flex: 1, textAlign: "center" }}>
                  {data.bodyWeight ? (
                    <span className="font-racing" style={{ fontSize: 38, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>{data.bodyWeight}<span style={{ fontSize: 16, color: "#6b7280", fontStyle: "normal" }}>kg</span></span>
                  ) : (
                    <span style={{ fontSize: 14, color: "#374151" }}>Tap pour saisir</span>
                  )}
                </div>
                <button onClick={() => setData(d => ({ ...d, bodyWeight: Math.round(((d.bodyWeight ?? 53.5) + 0.5) * 2) / 2 }))}
                  style={{ width: 60, height: 72, background: "none", border: "none", color: "#6b7280", fontSize: 26, cursor: "pointer", flexShrink: 0 }}>+</button>
              </div>
              <button onClick={() => setData(d => ({ ...d, bodyWeight: null }))}
                style={{ background: "none", border: "none", color: "#374151", fontSize: 13, cursor: "pointer", padding: "4px 0" }}>
                Passer cette étape →
              </button>
            </div>

          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <BodyMap value={data.painZones} onChange={v => setData(d => ({ ...d, painZones: v }))} />
            </div>
          )}
        </div>

        {/* Nav */}
        {!done && (
          <div style={{ display: "flex", gap: 10, paddingTop: 24 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: "16px 0", borderRadius: 16, border: "1px solid #1a1a2e", background: "transparent", color: "#6b7280", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Retour
              </button>
            )}
            <button onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : submit()} disabled={saving}
              style={{ flex: 2, padding: "16px 0", borderRadius: 16, border: "none", background: ACCENT, color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: `0 0 18px ${ACCENT}44`, fontFamily: "var(--font-barlow), system-ui", letterSpacing: "0.05em" }}>
              {step < STEPS.length - 1 ? "Suivant" : saving ? "Enregistrement…" : "Terminer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
