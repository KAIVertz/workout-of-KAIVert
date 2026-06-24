"use client";
import { useState } from "react";
import { DAY_LABEL, DayType, Exercise } from "@/lib/program";
import { Override, AddedExercise, Session } from "@/lib/types";

const ACCENT = "#0041C2";

interface Props {
  dayType: DayType;
  exercises: Exercise[];
  sessions: Session[];
  formScore: number | null;
  color: string;
  onStart: (duration: number, mods: Record<string, Override>, added: AddedExercise[]) => void;
  onCancel: () => void;
}

export function WorkoutConfigModal({ dayType, exercises, sessions, formScore, color, onStart, onCancel }: Props) {
  const [duration, setDuration] = useState(60);
  const [ariaText, setAriaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [mods, setMods] = useState<Record<string, Override>>({});
  const [added, setAdded] = useState<AddedExercise[]>([]);
  const { label } = DAY_LABEL[dayType];

  async function generatePlan() {
    setLoading(true);
    setAriaText("");
    setMods({});
    setAdded([]);
    const exList = exercises.map(e => `${e.name} ${e.sets}×${e.reps} (${e.weight})`).join(", ");
    const msg = `Je veux faire une séance de ${duration} minutes aujourd'hui (${label}). Programme : ${exList}.${formScore ? ` Forme du jour : ${formScore}/100.` : ""} Analyse mes séances passées (exercices manqués, non terminés, progressions stagnantes). Adapte pour ${duration} minutes. Tu peux modifier les séries (MODIFICATION →) et ajouter des exercices ou étirements Bryan Johnson (AJOUT →). 3 phrases max d'intro, puis les modifications et ajouts.`;
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: [], context: { sessions } }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setAriaText(text);
      }
      // Parse MODIFICATION →
      const parsedMods: Record<string, Override> = {};
      const modRegex = /MODIFICATION → ([^:]+) : sets=(\d+)(?:[,\s]+weight=([^\s,\n]+))?/g;
      let match;
      while ((match = modRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const sets = parseInt(match[2]);
        const weight = match[3]?.trim();
        parsedMods[name] = { sets, ...(weight ? { weight } : {}) };
      }
      setMods(parsedMods);
      // Parse AJOUT →
      const parsedAdded: AddedExercise[] = [];
      const ajoutRegex = /AJOUT → ([^:]+) : ([^\n]+)/g;
      while ((match = ajoutRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const params = match[2];
        const sets = parseInt(params.match(/sets=(\d+)/)?.[1] ?? "3");
        const reps = params.match(/reps=([^,\n]+)/)?.[1]?.trim() ?? "10";
        const weight = params.match(/weight=([^,\n]+)/)?.[1]?.trim() ?? "Poids du corps";
        const muscle = params.match(/muscle=([^,\n]+)/)?.[1]?.replace(/,.*/, "").trim() ?? "Général";
        const permanent = params.match(/permanent=(oui|non)/)?.[1] === "oui";
        parsedAdded.push({ name, sets, reps, weight, muscle, permanent });
      }
      setAdded(parsedAdded);
    } catch {
      setAriaText("Erreur — démarre manuellement.");
    } finally {
      setLoading(false);
    }
  }

  const hasMods = Object.keys(mods).length > 0 || added.length > 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60, background: "#08080d",
      display: "flex", flexDirection: "column",
      paddingTop: "max(56px, calc(env(safe-area-inset-top) + 24px))",
      paddingLeft: 24, paddingRight: 24,
      paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 16px))",
      overflowY: "auto",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${color}14 0%, transparent 60%)` }} />
      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Configurer la séance</p>
            <p className="font-racing" style={{ fontSize: 42, fontWeight: 900, fontStyle: "italic", color: "#fff", lineHeight: 1 }}>{label}</p>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#374151", fontSize: 28, cursor: "pointer", lineHeight: 1, paddingTop: 4 }}>×</button>
        </div>

        {/* Duration */}
        <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Durée cible</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {([30, 45, 60] as const).map(d => (
            <button key={d} onClick={() => { setDuration(d); setAriaText(""); setMods({}); }}
              style={{
                flex: 1, padding: "16px 0", borderRadius: 14,
                fontSize: 16, fontWeight: 700,
                border: duration === d ? `2px solid ${color}` : "1px solid #1a1a2e",
                background: duration === d ? color + "1a" : "#10101a",
                color: duration === d ? "#fff" : "#6b7280",
                cursor: "pointer",
                boxShadow: duration === d ? `0 0 16px ${color}33` : "none",
                transition: "all 0.15s",
              }}>
              {d}<span style={{ fontSize: 11, color: duration === d ? "#9ca3af" : "#374151", marginLeft: 2 }}>min</span>
            </button>
          ))}
        </div>

        {/* Programme summary */}
        <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Programme</p>
        <div style={{ background: "#10101a", border: "1px solid #1a1a2e", borderRadius: 18, overflow: "hidden", marginBottom: added.length ? 10 : 20 }}>
          {exercises.map((ex, i) => {
            const mod = mods[ex.name];
            const displaySets = mod?.sets ?? ex.sets;
            const changed = !!mod?.sets && mod.sets !== ex.sets;
            return (
              <div key={ex.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 18px",
                borderBottom: i < exercises.length - 1 ? "1px solid #0d0d1a" : "none",
                borderLeft: changed ? `3px solid ${color}` : "3px solid transparent",
              }}>
                <span style={{ fontSize: 13, color: changed ? "#9ca3af" : "#e5e7eb" }}>{ex.name}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {changed && <span style={{ fontSize: 11, color: "#374151", textDecoration: "line-through" }}>{ex.sets}×</span>}
                  <span className="font-racing" style={{ fontSize: 15, fontWeight: 700, color: changed ? color : "#fff" }}>
                    {displaySets}×{ex.reps}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Added exercises */}
        {added.length > 0 && (
          <>
            <p style={{ fontSize: 10, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              + Ajouts ARIA
            </p>
            <div style={{ background: "#0a0a14", border: `1px solid ${ACCENT}33`, borderRadius: 18, overflow: "hidden", marginBottom: 20 }}>
              {added.map((ex, i) => (
                <div key={ex.name} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 18px",
                  borderBottom: i < added.length - 1 ? "1px solid #0d0d1a" : "none",
                  borderLeft: `3px solid ${ACCENT}`,
                }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#e5e7eb" }}>{ex.name}</span>
                    <span style={{ fontSize: 11, color: "#374151", marginLeft: 8 }}>{ex.muscle}</span>
                    {ex.permanent && <span style={{ fontSize: 10, color: ACCENT, marginLeft: 6, fontWeight: 700 }}>★ permanent</span>}
                  </div>
                  <span className="font-racing" style={{ fontSize: 15, fontWeight: 700, color: ACCENT }}>
                    {ex.sets}×{ex.reps}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ARIA plan */}
        <p style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Plan ARIA</p>
        <div style={{ background: "#0a0a14", border: `1px solid ${ariaText ? ACCENT + "33" : "#1a1a2e"}`, borderRadius: 16, padding: "14px 16px", marginBottom: 14, minHeight: 72, transition: "border-color 0.3s" }}>
          {ariaText ? (
            <p style={{ fontSize: 14, color: "#e5e7eb", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ariaText}</p>
          ) : (
            <p style={{ fontSize: 13, color: "#374151" }}>
              {loading ? "Génération du plan…" : `ARIA adapte ton programme pour ${duration} minutes.`}
            </p>
          )}
        </div>

        <button onClick={generatePlan} disabled={loading}
          style={{
            padding: "13px 0", borderRadius: 14,
            border: `1px solid ${ACCENT}44`, background: ACCENT + "12",
            color: ACCENT, fontSize: 13, fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            letterSpacing: "0.04em", fontFamily: "var(--font-barlow), system-ui",
            textTransform: "uppercase", marginBottom: 28,
            opacity: loading ? 0.6 : 1, transition: "opacity 0.15s",
          }}>
          {loading ? "Génération…" : "Générer avec ARIA"}
        </button>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          <button onClick={() => onStart(duration, mods, added)}
            style={{
              padding: "19px 0", borderRadius: 16, border: "none",
              background: color, color: "#fff", fontSize: 15, fontWeight: 800,
              cursor: "pointer", fontFamily: "var(--font-barlow), system-ui",
              letterSpacing: "0.06em", textTransform: "uppercase",
              boxShadow: `0 0 28px ${color}44`,
            }}>
            {hasMods ? "Démarrer avec ce plan" : `Démarrer (${duration} min)`}
          </button>
          {hasMods && (
            <button onClick={() => onStart(duration, {}, [])}
              style={{ padding: "15px 0", borderRadius: 16, border: "1px solid #1a1a2e", background: "transparent", color: "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Démarrer sans modifications
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
