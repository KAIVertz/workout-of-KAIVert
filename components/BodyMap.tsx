"use client";
import { useState } from "react";

export type PainZone = { zone: string; intensity: 1 | 2 | 3 };

const INTENSITY_COLOR = ["#1a1a2e", "#0041C2", "#EA580C", "#DC2626"];
const INTENSITY_GLOW  = ["",        "#0041C260", "#EA580C60", "#DC262660"];

interface Zone {
  id: string; label: string; shape: "ellipse" | "rect";
  cx?: number; cy?: number; rx?: number; ry?: number;
  x?: number; y?: number; w?: number; h?: number; rx2?: number;
}

const ZONES: Zone[] = [
  { id: "rightShoulder", label: "Épaule D",     shape: "ellipse", cx: 60,  cy: 87,  rx: 20, ry: 18 },
  { id: "leftShoulder",  label: "Épaule G",     shape: "ellipse", cx: 140, cy: 87,  rx: 20, ry: 18 },
  { id: "rightPec",      label: "Pec D",        shape: "rect",    x: 64,   y: 74,   w: 36,  h: 50,  rx2: 6 },
  { id: "leftPec",       label: "Pec G",        shape: "rect",    x: 100,  y: 74,   w: 36,  h: 50,  rx2: 6 },
  { id: "rightBicep",    label: "Biceps D",     shape: "rect",    x: 31,   y: 80,   w: 20,  h: 56,  rx2: 9 },
  { id: "leftBicep",     label: "Biceps G",     shape: "rect",    x: 149,  y: 80,   w: 20,  h: 56,  rx2: 9 },
  { id: "rightForearm",  label: "Avant-bras D", shape: "rect",    x: 33,   y: 136,  w: 16,  h: 44,  rx2: 7 },
  { id: "leftForearm",   label: "Avant-bras G", shape: "rect",    x: 151,  y: 136,  w: 16,  h: 44,  rx2: 7 },
  { id: "abs",           label: "Abdos",        shape: "rect",    x: 76,   y: 126,  w: 48,  h: 46,  rx2: 7 },
  { id: "hips",          label: "Hanches",      shape: "rect",    x: 72,   y: 170,  w: 56,  h: 28,  rx2: 10 },
  { id: "rightQuad",     label: "Cuisse D",     shape: "rect",    x: 73,   y: 195,  w: 25,  h: 68,  rx2: 10 },
  { id: "leftQuad",      label: "Cuisse G",     shape: "rect",    x: 102,  y: 195,  w: 25,  h: 68,  rx2: 10 },
  { id: "rightKnee",     label: "Genou D",      shape: "ellipse", cx: 85,  cy: 274, rx: 14, ry: 12 },
  { id: "leftKnee",      label: "Genou G",      shape: "ellipse", cx: 115, cy: 274, rx: 14, ry: 12 },
  { id: "rightCalf",     label: "Mollet D",     shape: "rect",    x: 75,   y: 284,  w: 20,  h: 62,  rx2: 9 },
  { id: "leftCalf",      label: "Mollet G",     shape: "rect",    x: 105,  y: 284,  w: 20,  h: 62,  rx2: 9 },
];

interface Props {
  value: Record<string, 0 | 1 | 2 | 3>;
  onChange: (v: Record<string, 0 | 1 | 2 | 3>) => void;
  readonly?: boolean;
}

export function BodyMap({ value, onChange, readonly }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  function tap(id: string) {
    if (readonly) return;
    const cur = (value[id] ?? 0) as 0 | 1 | 2 | 3;
    onChange({ ...value, [id]: ((cur + 1) % 4) as 0 | 1 | 2 | 3 });
  }

  const painCount = ZONES.filter((z) => (value[z.id] ?? 0) > 0).length;
  const hoveredZone = hovered ? ZONES.find((z) => z.id === hovered) : null;
  const hoveredIntensity = hovered ? (value[hovered] ?? 0) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* Status label */}
      <div style={{ height: 20, display: "flex", alignItems: "center" }}>
        {hoveredZone ? (
          <span style={{ fontSize: 13, color: hoveredIntensity > 0 ? INTENSITY_COLOR[hoveredIntensity] : "#9ca3af", fontWeight: 500 }}>
            {hoveredZone.label}{hoveredIntensity > 0 ? ` — ${["", "légère", "modérée", "forte"][hoveredIntensity]}` : " — aucune douleur"}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "#374151" }}>
            {painCount === 0 ? "Tape les zones douloureuses" : `${painCount} zone${painCount > 1 ? "s" : ""} marquée${painCount > 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      <svg viewBox="0 0 200 370" style={{ width: 170, height: 315, userSelect: "none" }}>
        {/* ── Silhouette complète (fond) ── */}
        {/* Tête */}
        <ellipse cx="100" cy="26" rx="23" ry="25" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Cou */}
        <rect x="90" y="48" width="20" height="18" rx="5" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Torse (pecs + abs + hanches en un bloc) */}
        <rect x="62" y="68" width="76" height="138" rx="14" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Bras supérieurs */}
        <rect x="28" y="74" width="26" height="68" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="146" y="74" width="26" height="68" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Avant-bras */}
        <rect x="30" y="130" width="22" height="54" rx="10" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="148" y="130" width="22" height="54" rx="10" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Cuisses */}
        <rect x="70" y="192" width="28" height="76" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="102" y="192" width="28" height="76" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Genoux */}
        <ellipse cx="85" cy="275" rx="15" ry="13" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <ellipse cx="115" cy="275" rx="15" ry="13" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Mollets */}
        <rect x="73" y="282" width="24" height="68" rx="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="103" y="282" width="24" height="68" rx="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        {/* Pieds (déco) */}
        <ellipse cx="83" cy="357" rx="19" ry="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <ellipse cx="117" cy="357" rx="19" ry="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />

        {/* ── Zones interactives ── */}
        {ZONES.map((z) => {
          const intensity = (value[z.id] ?? 0) as 0 | 1 | 2 | 3;
          const fill = INTENSITY_COLOR[intensity];
          const active = intensity > 0;
          const isHovered = hovered === z.id;

          const sharedProps = {
            fill,
            stroke: active ? INTENSITY_COLOR[intensity] : isHovered ? "#374151" : "transparent",
            strokeWidth: active ? 1.5 : 1,
            opacity: active ? 1 : isHovered ? 0.6 : 0.45,
            style: {
              cursor: readonly ? "default" : "pointer",
              transition: "fill 0.18s, opacity 0.15s",
              filter: active ? `drop-shadow(0 0 6px ${INTENSITY_GLOW[intensity]})` : undefined,
            } as React.CSSProperties,
            onClick: () => tap(z.id),
            onMouseEnter: () => setHovered(z.id),
            onMouseLeave: () => setHovered(null),
            onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); setHovered(z.id); },
            onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); tap(z.id); setHovered(null); },
          };

          if (z.shape === "ellipse") {
            return <ellipse key={z.id} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...sharedProps} />;
          }
          return <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx2 ?? 0} {...sharedProps} />;
        })}
      </svg>

      {/* Legend */}
      {!readonly && (
        <div style={{ display: "flex", gap: 14 }}>
          {(["Légère", "Modérée", "Forte"] as const).map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: INTENSITY_COLOR[i + 1] }} />
              <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
