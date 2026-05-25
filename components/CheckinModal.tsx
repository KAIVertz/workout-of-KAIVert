"use client";
import { useState } from "react";
import { BodyMap } from "./BodyMap";
import { localDate } from "@/lib/program";

interface CheckinData {
  energy: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  mood: string;
  painZones: Record<string, 0 | 1 | 2 | 3>;
}

const ENERGY_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😴", label: "Épuisé" },
  2: { emoji: "😕", label: "Fatigué" },
  3: { emoji: "😐", label: "Normal" },
  4: { emoji: "💪", label: "Chargé" },
  5: { emoji: "🔥", label: "En feu" },
};

const MOODS = ["😤", "😌", "😐", "😴", "🔥"];
const MOOD_LABELS = ["Motivé", "Serein", "Neutre", "Fatigué", "Ultra motivé"];
const SLEEP_HOURS = [5, 6, 7, 8, 9];

export function CheckinModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CheckinData>({
    energy: 3,
    sleepHours: 7,
    sleepQuality: 3,
    mood: "😐",
    painZones: {},
  });
  const [saving, setSaving] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [done, setDone] = useState(false);

  const STEPS = ["Énergie", "Sommeil", "Humeur", "Douleurs"];

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
          pain_zones: painArr,
        }),
      });

      // Get AI morning brief
      const painSummary = painArr.length
        ? `Zones douloureuses : ${painArr.map((p) => `${p.zone} (${["", "légère", "modérée", "forte"][p.intensity]})`).join(", ")}.`
        : "Pas de douleurs.";

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Check-in matin : énergie ${data.energy}/5, sommeil ${data.sleepHours}h qualité ${data.sleepQuality}/5, humeur ${data.mood}. ${painSummary} Donne-moi un brief de la journée en 2-3 lignes max.`,
          history: [],
          context: {},
        }),
      });

      if (res.ok) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done: d, value } = await reader.read();
          if (d) break;
          text += decoder.decode(value, { stream: true });
          setAiMessage(text);
        }
      }
    } catch {
      setAiMessage("Bonne séance aujourd'hui !");
    } finally {
      setSaving(false);
      setDone(true);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "#08080d",
        display: "flex", flexDirection: "column",
        paddingTop: "max(56px, calc(env(safe-area-inset-top) + 24px))",
        paddingLeft: 24, paddingRight: 24,
        paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 16px))",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Check-in · Matin
          </p>
          {!done && (
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 2 }}>
              {STEPS[step]}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#374151", fontSize: 24, cursor: "pointer", lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Step dots */}
      {!done && (
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 3, flex: 1, borderRadius: 2,
                background: i <= step ? "#0041C2" : "#1a1a2e",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {done ? (
          /* AI Brief */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>
                {ENERGY_LABELS[data.energy].emoji}
              </p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
                Bonjour KAI
              </p>
            </div>
            {aiMessage ? (
              <div style={{
                background: "#10101a", border: "1px solid #1a1a2e",
                borderRadius: 16, padding: "20px",
              }}>
                <p style={{ fontSize: 11, color: "#0041C2", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Brief du coach
                </p>
                <p style={{ fontSize: 15, color: "#fff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {aiMessage}
                </p>
              </div>
            ) : (
              <p style={{ color: "#374151", fontSize: 14, textAlign: "center" }}>
                {saving ? "Le coach prépare ton brief…" : ""}
              </p>
            )}
            <button
              onClick={onClose}
              style={{
                marginTop: "auto", padding: "18px 0", borderRadius: 16,
                border: "none", background: "#0041C2",
                color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
              }}
            >
              C'est parti 🔥
            </button>
          </div>
        ) : step === 0 ? (
          /* Step 1: Energy */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([1, 2, 3, 4, 5] as const).map((v) => (
              <button
                key={v}
                onClick={() => setData((d) => ({ ...d, energy: v }))}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 20px", borderRadius: 16,
                  border: data.energy === v ? "2px solid #0041C2" : "1px solid #1a1a2e",
                  background: data.energy === v ? "#0041C222" : "#10101a",
                  cursor: "pointer", color: "inherit", textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 28 }}>{ENERGY_LABELS[v].emoji}</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{v}/5</p>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>{ENERGY_LABELS[v].label}</p>
                </div>
              </button>
            ))}
          </div>
        ) : step === 1 ? (
          /* Step 2: Sleep */
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Heures de sommeil</p>
              <div style={{ display: "flex", gap: 8 }}>
                {SLEEP_HOURS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setData((d) => ({ ...d, sleepHours: h }))}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 14,
                      border: data.sleepHours === h ? "2px solid #0041C2" : "1px solid #1a1a2e",
                      background: data.sleepHours === h ? "#0041C222" : "#10101a",
                      color: data.sleepHours === h ? "#fff" : "#6b7280",
                      fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Qualité du sommeil</p>
              <div style={{ display: "flex", gap: 8 }}>
                {([1, 2, 3, 4, 5] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setData((d) => ({ ...d, sleepQuality: v }))}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 14,
                      border: data.sleepQuality === v ? "2px solid #0041C2" : "1px solid #1a1a2e",
                      background: data.sleepQuality === v ? "#0041C222" : "#10101a",
                      color: data.sleepQuality === v ? "#0041C2" : "#374151",
                      fontWeight: 900, fontSize: 18, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          /* Step 3: Mood */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOODS.map((emoji, i) => (
              <button
                key={emoji}
                onClick={() => setData((d) => ({ ...d, mood: emoji }))}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 20px", borderRadius: 16,
                  border: data.mood === emoji ? "2px solid #0041C2" : "1px solid #1a1a2e",
                  background: data.mood === emoji ? "#0041C222" : "#10101a",
                  cursor: "pointer", color: "inherit", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 26 }}>{emoji}</span>
                <span style={{ fontSize: 15, color: data.mood === emoji ? "#fff" : "#6b7280", fontWeight: data.mood === emoji ? 700 : 400 }}>
                  {MOOD_LABELS[i]}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Step 4: Pain map */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <BodyMap
              value={data.painZones}
              onChange={(v) => setData((d) => ({ ...d, painZones: v }))}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      {!done && (
        <div style={{ display: "flex", gap: 12, paddingTop: 20 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1, padding: "16px 0", borderRadius: 16,
                border: "1px solid #1a1a2e", background: "transparent",
                color: "#6b7280", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              Retour
            </button>
          )}
          <button
            onClick={() => {
              if (step < STEPS.length - 1) setStep((s) => s + 1);
              else submit();
            }}
            disabled={saving}
            style={{
              flex: 2, padding: "16px 0", borderRadius: 16,
              border: "none", background: "#0041C2",
              color: "#fff", fontSize: 15, fontWeight: 800,
              cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1,
            }}
          >
            {step < STEPS.length - 1 ? "Suivant" : saving ? "Analyse…" : "Terminer"}
          </button>
        </div>
      )}
    </div>
  );
}
