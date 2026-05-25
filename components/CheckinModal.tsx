"use client";
import { useState } from "react";
import { BodyMap } from "./BodyMap";
import { localDate } from "@/lib/program";

interface CheckinData {
  energy: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  mood: 1 | 2 | 3 | 4 | 5;
  painZones: Record<string, 0 | 1 | 2 | 3>;
}

const ENERGY_LABELS = ["Épuisé", "Fatigué", "Normal", "Chargé", "En feu"];
const MOOD_LABELS   = ["Stressé", "Fatigué", "Neutre", "Serein", "Motivé"];
const SLEEP_OPTIONS = [5, 6, 7, 8, 9];

function LevelBar({
  value, max = 5, onChange, labels, accent = "#0041C2",
}: {
  value: number; max?: number; onChange: (v: number) => void;
  labels?: string[]; accent?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              flex: 1, height: 44, borderRadius: 10, border: "none",
              background: v <= value ? accent : "#10101a",
              outline: v === value ? `2px solid ${accent}` : "1px solid #1a1a2e",
              outlineOffset: v === value ? 2 : 0,
              cursor: "pointer", transition: "all 0.12s",
              opacity: v <= value ? 1 : 0.4 + (v / max) * 0.2,
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

const STEPS = ["Énergie", "Sommeil", "Humeur", "Douleurs"];

export function CheckinModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CheckinData>({
    energy: 3, sleepHours: 7, sleepQuality: 3, mood: 3, painZones: {},
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
          mood: String(data.mood),
          pain_zones: painArr,
        }),
      });

      const painSummary = painArr.length
        ? `Douleurs : ${painArr.map((p) => `${p.zone} (${["", "légère", "modérée", "forte"][p.intensity]})`).join(", ")}.`
        : "Pas de douleurs.";

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Check-in matin : énergie ${data.energy}/5, sommeil ${data.sleepHours}h qualité ${data.sleepQuality}/5, humeur ${data.mood}/5. ${painSummary} Donne-moi un brief de la journée en 2-3 lignes max.`,
          history: [],
          context: {},
        }),
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
      } else {
        setDone(true);
      }
    } catch {
      setDone(true);
      setAiMessage("Check-in enregistré. Bonne séance !");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "#08080d",
      display: "flex", flexDirection: "column",
      paddingTop: "max(56px, calc(env(safe-area-inset-top) + 24px))",
      paddingLeft: 24, paddingRight: 24,
      paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 16px))",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Check-in · Matin
          </p>
          {!done && (
            <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginTop: 4 }}>
              {STEPS[step]}
            </p>
          )}
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: "#374151", fontSize: 26, cursor: "pointer", lineHeight: 1, paddingTop: 2 }}>
          ×
        </button>
      </div>

      {/* Progress bar */}
      {!done && (
        <div style={{ display: "flex", gap: 5, marginBottom: 36 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i <= step ? "#0041C2" : "#1a1a2e",
              transition: "background 0.2s",
            }} />
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {done ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
            <div>
              <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>Bonjour KAI</p>
              <p style={{ fontSize: 14, color: "#6b7280" }}>Check-in enregistré</p>
            </div>
            {aiMessage ? (
              <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 11, color: "#0041C2", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Brief du coach
                </p>
                <p style={{ fontSize: 15, color: "#fff", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{aiMessage}</p>
              </div>
            ) : (
              <p style={{ color: "#374151", fontSize: 14 }}>{saving ? "Analyse en cours…" : ""}</p>
            )}
            <button onClick={onClose}
              style={{ marginTop: "auto", padding: "18px 0", borderRadius: 16, border: "none", background: "#0041C2", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
              C'est parti
            </button>
          </div>
        ) : step === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Comment tu te sens physiquement ?</p>
            <LevelBar value={data.energy} onChange={(v) => setData((d) => ({ ...d, energy: v as CheckinData["energy"] }))} labels={ENERGY_LABELS} />
          </div>
        ) : step === 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Heures de sommeil</p>
              <div style={{ display: "flex", gap: 6 }}>
                {SLEEP_OPTIONS.map((h) => (
                  <button key={h} onClick={() => setData((d) => ({ ...d, sleepHours: h }))}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 12,
                      border: data.sleepHours === h ? "2px solid #0041C2" : "1px solid #1a1a2e",
                      background: data.sleepHours === h ? "#0041C222" : "#10101a",
                      color: data.sleepHours === h ? "#fff" : "#6b7280",
                      fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.12s",
                    }}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Qualité du sommeil</p>
              <LevelBar
                value={data.sleepQuality}
                onChange={(v) => setData((d) => ({ ...d, sleepQuality: v as CheckinData["sleepQuality"] }))}
                labels={["Très mauvaise", "Mauvaise", "Correcte", "Bonne", "Excellente"]}
              />
            </div>
          </div>
        ) : step === 2 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Comment tu te sens mentalement ?</p>
            <LevelBar
              value={data.mood}
              onChange={(v) => setData((d) => ({ ...d, mood: v as CheckinData["mood"] }))}
              labels={MOOD_LABELS}
              accent="#0041C2"
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <BodyMap value={data.painZones} onChange={(v) => setData((d) => ({ ...d, painZones: v }))} />
          </div>
        )}
      </div>

      {/* Nav */}
      {!done && (
        <div style={{ display: "flex", gap: 10, paddingTop: 24 }}>
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              style={{ flex: 1, padding: "16px 0", borderRadius: 14, border: "1px solid #1a1a2e", background: "transparent", color: "#6b7280", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Retour
            </button>
          )}
          <button
            onClick={() => step < STEPS.length - 1 ? setStep((s) => s + 1) : submit()}
            disabled={saving}
            style={{ flex: 2, padding: "16px 0", borderRadius: 14, border: "none", background: "#0041C2", color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {step < STEPS.length - 1 ? "Suivant" : saving ? "Enregistrement…" : "Terminer"}
          </button>
        </div>
      )}
    </div>
  );
}
