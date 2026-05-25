"use client";
import { useState } from "react";

export type PainZone = { zone: string; intensity: 1 | 2 | 3 };

const INTENSITY_COLOR = ["#10101a", "#0041C2", "#EA580C", "#DC2626"];

interface Zone {
  id: string;
  label: string;
  shape: "ellipse" | "rect";
  cx?: number; cy?: number; rx?: number; ry?: number;
  x?: number; y?: number; w?: number; h?: number; rx2?: number;
}

const ZONES: Zone[] = [
  { id: "rightShoulder", label: "Épaule D",     shape: "ellipse", cx: 60,  cy: 84,  rx: 20, ry: 18 },
  { id: "leftShoulder",  label: "Épaule G",     shape: "ellipse", cx: 140, cy: 84,  rx: 20, ry: 18 },
  { id: "rightPec",      label: "Pec D",        shape: "rect",    x: 64,   y: 70,   w: 36,  h: 52,  rx2: 8 },
  { id: "leftPec",       label: "Pec G",        shape: "rect",    x: 100,  y: 70,   w: 36,  h: 52,  rx2: 8 },
  { id: "rightBicep",    label: "Biceps D",     shape: "rect",    x: 32,   y: 78,   w: 20,  h: 58,  rx2: 9 },
  { id: "leftBicep",     label: "Biceps G",     shape: "rect",    x: 148,  y: 78,   w: 20,  h: 58,  rx2: 9 },
  { id: "rightForearm",  label: "Avant-bras D", shape: "rect",    x: 34,   y: 136,  w: 16,  h: 46,  rx2: 7 },
  { id: "leftForearm",   label: "Avant-bras G", shape: "rect",    x: 150,  y: 136,  w: 16,  h: 46,  rx2: 7 },
  { id: "abs",           label: "Abdos",        shape: "rect",    x: 76,   y: 124,  w: 48,  h: 48,  rx2: 8 },
  { id: "hips",          label: "Hanches",      shape: "rect",    x: 72,   y: 170,  w: 56,  h: 30,  rx2: 12 },
  { id: "rightQuad",     label: "Cuisse D",     shape: "rect",    x: 73,   y: 197,  w: 25,  h: 70,  rx2: 10 },
  { id: "leftQuad",      label: "Cuisse G",     shape: "rect",    x: 102,  y: 197,  w: 25,  h: 70,  rx2: 10 },
  { id: "rightKnee",     label: "Genou D",      shape: "ellipse", cx: 85,  cy: 278, rx: 14, ry: 12 },
  { id: "leftKnee",      label: "Genou G",      shape: "ellipse", cx: 115, cy: 278, rx: 14, ry: 12 },
  { id: "rightCalf",     label: "Mollet D",     shape: "rect",    x: 75,   y: 288,  w: 20,  h: 64,  rx2: 9 },
  { id: "leftCalf",      label: "Mollet G",     shape: "rect",    x: 105,  y: 288,  w: 20,  h: 64,  rx2: 9 },
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
    const next = ((cur + 1) % 4) as 0 | 1 | 2 | 3;
    onChange({ ...value, [id]: next });
  }

  const painCount = ZONES.filter((z) => (value[z.id] ?? 0) > 0).length;
  const hoveredZone = hovered ? ZONES.find((z) => z.id === hovered) : null;
  const hoveredIntensity = hovered ? (value[hovered] ?? 0) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* Status label */}
      <div style={{ height: 20, display: "flex", alignItems: "center" }}>
        {hoveredZone ? (
          <span style={{ fontSize: 13, color: INTENSITY_COLOR[hoveredIntensity] || "#9ca3af", fontWeight: 500 }}>
            {hoveredZone.label}{hoveredIntensity > 0 ? ` — ${["", "légère", "modérée", "forte"][hoveredIntensity]}` : ""}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "#374151" }}>
            {painCount === 0
              ? "Tape les zones douloureuses"
              : `${painCount} zone${painCount > 1 ? "s" : ""} marquée${painCount > 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* SVG */}
      <svg viewBox="0 0 200 370" style={{ width: 170, height: 315, userSelect: "none" }}>
        {/* Head + neck (decorative) */}
        <ellipse cx="100" cy="26" rx="22" ry="24" fill="#10101a" />
        <rect x="91" y="47" width="18" height="16" rx="6" fill="#10101a" />

        {/* Zones */}
        {ZONES.map((z) => {
          const intensity = (value[z.id] ?? 0) as 0 | 1 | 2 | 3;
          const fill = INTENSITY_COLOR[intensity];
          const glowing = intensity > 0;
          const props = {
            fill,
            stroke: glowing ? fill : "#1a1a2e",
            strokeWidth: glowing ? 1.5 : 0.5,
            style: {
              cursor: readonly ? "default" : "pointer",
              transition: "fill 0.18s",
              filter: glowing ? `drop-shadow(0 0 5px ${fill}60)` : undefined,
            } as React.CSSProperties,
            onClick: () => tap(z.id),
            onMouseEnter: () => setHovered(z.id),
            onMouseLeave: () => setHovered(null),
            onTouchStart: () => setHovered(z.id),
            onTouchEnd: () => { tap(z.id); setHovered(null); },
          };

          if (z.shape === "ellipse") {
            return <ellipse key={z.id} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...props} />;
          }
          return <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx2 ?? 0} {...props} />;
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
