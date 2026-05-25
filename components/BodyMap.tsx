"use client";
import { useRef, useState } from "react";

const INTENSITY_COLOR = ["transparent", "#0041C2", "#EA580C", "#DC2626"];
const INTENSITY_ALPHA = ["00", "55", "55", "55"];

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

function hitTest(x: number, y: number, z: Zone): boolean {
  if (z.shape === "rect") {
    return x >= z.x! && x <= z.x! + z.w! && y >= z.y! && y <= z.y! + z.h!;
  }
  const dx = (x - z.cx!) / z.rx!;
  const dy = (y - z.cy!) / z.ry!;
  return dx * dx + dy * dy <= 1;
}

interface Props {
  value: Record<string, 0 | 1 | 2 | 3>;
  onChange: (v: Record<string, 0 | 1 | 2 | 3>) => void;
  readonly?: boolean;
}

export function BodyMap({ value, onChange, readonly }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const painting = useRef(false);
  const lastHit = useRef<string | null>(null);
  const [lastLabel, setLastLabel] = useState<string | null>(null);

  function toSvgCoords(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (200 / rect.width),
      y: (clientY - rect.top) * (370 / rect.height),
    };
  }

  function paint(clientX: number, clientY: number) {
    if (readonly) return;
    const { x, y } = toSvgCoords(clientX, clientY);
    const zone = ZONES.find((z) => hitTest(x, y, z));
    if (!zone || zone.id === lastHit.current) return;
    lastHit.current = zone.id;
    setLastLabel(zone.label);
    // Paint at intensity 1 — tap again later to increase
    if ((value[zone.id] ?? 0) === 0) {
      onChange({ ...value, [zone.id]: 1 });
    }
  }

  function tapZone(id: string) {
    if (readonly) return;
    const cur = (value[id] ?? 0) as 0 | 1 | 2 | 3;
    onChange({ ...value, [id]: ((cur + 1) % 4) as 0 | 1 | 2 | 3 });
  }

  const painCount = ZONES.filter((z) => (value[z.id] ?? 0) > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ height: 20, display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          {painCount === 0
            ? "Glisse sur les zones douloureuses"
            : lastLabel
            ? `${lastLabel} marquée — retape pour changer l'intensité`
            : `${painCount} zone${painCount > 1 ? "s" : ""} marquée${painCount > 1 ? "s" : ""}`}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 200 370"
        style={{ width: 170, height: 315, userSelect: "none", touchAction: "none" }}
        onPointerDown={(e) => {
          painting.current = true;
          lastHit.current = null;
          e.currentTarget.setPointerCapture(e.pointerId);
          paint(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => { if (painting.current) paint(e.clientX, e.clientY); }}
        onPointerUp={() => { painting.current = false; lastHit.current = null; }}
      >
        {/* Silhouette */}
        <ellipse cx="100" cy="26" rx="23" ry="25" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="90" y="48" width="20" height="18" rx="5" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="62" y="68" width="76" height="138" rx="14" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="28" y="74" width="26" height="68" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="146" y="74" width="26" height="68" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="30" y="130" width="22" height="54" rx="10" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="148" y="130" width="22" height="54" rx="10" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="70" y="192" width="28" height="76" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="102" y="192" width="28" height="76" rx="12" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <ellipse cx="85" cy="275" rx="15" ry="13" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <ellipse cx="115" cy="275" rx="15" ry="13" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="73" y="282" width="24" height="68" rx="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <rect x="103" y="282" width="24" height="68" rx="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <ellipse cx="83" cy="357" rx="19" ry="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />
        <ellipse cx="117" cy="357" rx="19" ry="11" fill="#0f0f1e" stroke="#242438" strokeWidth="1" />

        {/* Pain overlay — painted zones */}
        {ZONES.map((z) => {
          const intensity = (value[z.id] ?? 0) as 0 | 1 | 2 | 3;
          if (intensity === 0) return null;
          const color = INTENSITY_COLOR[intensity];
          const props = {
            fill: color + INTENSITY_ALPHA[intensity],
            stroke: color,
            strokeWidth: 2,
            style: { pointerEvents: "all" as const, cursor: "pointer", transition: "fill 0.15s" },
            onClick: (e: React.MouseEvent) => { e.stopPropagation(); tapZone(z.id); },
          };
          if (z.shape === "ellipse") return <ellipse key={z.id} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...props} />;
          return <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx2} {...props} />;
        })}
      </svg>

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
