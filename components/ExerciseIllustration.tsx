import type { IllustrationType } from "@/lib/program";

const B = "#555";   // body
const L = "#888";   // active limb
const W = "#aaa";   // highlight / arrow
const E = "#2a2a2a"; // equipment fill
const ES = "#555";  // equipment stroke
const FL = "#1e1e1e"; // floor

export function ExerciseIllustration({ type }: { type: IllustrationType }) {
  const C: React.SVGProps<SVGSVGElement> = {
    viewBox: "0 0 120 72",
    width: 120,
    height: 72,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (type) {
    // ── Floor Press ──────────────────────────────────────────────────────────
    case "press":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* body lying */}
          <rect x="18" y="59" width="72" height="10" rx="5" stroke={B} strokeWidth="1.5" />
          {/* head */}
          <circle cx="100" cy="62" r="7" stroke={B} strokeWidth="1.5" />
          {/* arms up */}
          <line x1="40" y1="60" x2="28" y2="34" stroke={L} strokeWidth="2" />
          <line x1="62" y1="60" x2="74" y2="34" stroke={L} strokeWidth="2" />
          {/* dumbbells */}
          <rect x="20" y="28" width="16" height="7" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          <rect x="66" y="28" width="16" height="7" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* arrows up */}
          <path d="M28 24 L28 16" stroke={W} strokeWidth="1.5" />
          <path d="M25 19 L28 16 L31 19" stroke={W} strokeWidth="1.5" />
          <path d="M74 24 L74 16" stroke={W} strokeWidth="1.5" />
          <path d="M71 19 L74 16 L77 19" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Fly ──────────────────────────────────────────────────────────────────
    case "fly":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          <rect x="18" y="59" width="72" height="10" rx="5" stroke={B} strokeWidth="1.5" />
          <circle cx="100" cy="62" r="7" stroke={B} strokeWidth="1.5" />
          {/* arms wide */}
          <line x1="35" y1="61" x2="10" y2="40" stroke={L} strokeWidth="2" />
          <line x1="67" y1="61" x2="92" y2="40" stroke={L} strokeWidth="2" />
          {/* dumbbells */}
          <circle cx="10" cy="38" r="5" fill={E} stroke={ES} strokeWidth="1.5" />
          <circle cx="92" cy="38" r="5" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* arc arrows showing movement inward */}
          <path d="M18 32 Q35 22 50 28" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M84 32 Q67 22 52 28" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M48 26 L50 28 L52 26" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Push-up ──────────────────────────────────────────────────────────────
    case "pushup":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* body diagonal */}
          <line x1="20" y1="64" x2="90" y2="38" stroke={B} strokeWidth="8" strokeLinecap="round" />
          {/* head */}
          <circle cx="97" cy="33" r="7" stroke={B} strokeWidth="1.5" />
          {/* arms */}
          <line x1="30" y1="62" x2="22" y2="68" stroke={L} strokeWidth="2.5" />
          <line x1="40" y1="57" x2="32" y2="63" stroke={L} strokeWidth="2.5" />
          {/* hands on floor */}
          <circle cx="22" cy="68" r="3" fill={E} stroke={ES} strokeWidth="1" />
          <circle cx="32" cy="64" r="3" fill={E} stroke={ES} strokeWidth="1" />
          {/* arrow showing up */}
          <path d="M60 50 L60 42" stroke={W} strokeWidth="1.5" />
          <path d="M57 45 L60 42 L63 45" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Leg Raise ─────────────────────────────────────────────────────────────
    case "leg-raise":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* body */}
          <rect x="20" y="60" width="60" height="9" rx="4.5" stroke={B} strokeWidth="1.5" />
          {/* head */}
          <circle cx="90" cy="63" r="6.5" stroke={B} strokeWidth="1.5" />
          {/* legs up */}
          <line x1="25" y1="61" x2="25" y2="22" stroke={L} strokeWidth="3" />
          <line x1="38" y1="61" x2="38" y2="22" stroke={L} strokeWidth="3" />
          {/* feet */}
          <line x1="20" y1="22" x2="43" y2="22" stroke={L} strokeWidth="2.5" />
          {/* arrow */}
          <path d="M50 42 L57 42" stroke={W} strokeWidth="1.5" />
          <path d="M54 39 L57 42 L54 45" stroke={W} strokeWidth="1.5" />
          <path d="M60 38 L60 30" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M57 33 L60 30 L63 33" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Crunch ────────────────────────────────────────────────────────────────
    case "crunch":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* lower body flat */}
          <rect x="15" y="59" width="55" height="9" rx="4.5" stroke={B} strokeWidth="1.5" />
          {/* knees bent */}
          <line x1="20" y1="60" x2="14" y2="52" stroke={B} strokeWidth="2.5" />
          <line x1="35" y1="60" x2="29" y2="52" stroke={B} strokeWidth="2.5" />
          <line x1="14" y1="52" x2="20" y2="60" stroke={B} strokeWidth="2" />
          {/* upper body curling */}
          <path d="M55 60 Q65 55 72 44" stroke={L} strokeWidth="7" strokeLinecap="round" />
          {/* head */}
          <circle cx="78" cy="39" r="6.5" stroke={L} strokeWidth="1.5" />
          {/* hands behind head */}
          <path d="M72 40 Q80 32 85 40" stroke={B} strokeWidth="1.5" />
          {/* arrow curling */}
          <path d="M88 52 Q95 44 90 36" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M87 38 L90 36 L90 39" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Bicycle Crunch ────────────────────────────────────────────────────────
    case "bicycle":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* body */}
          <rect x="30" y="58" width="50" height="9" rx="4.5" stroke={B} strokeWidth="1.5" />
          {/* head up + twist */}
          <circle cx="85" cy="46" r="6.5" stroke={L} strokeWidth="1.5" />
          {/* one knee up */}
          <line x1="35" y1="59" x2="22" y2="44" stroke={L} strokeWidth="2.5" />
          <line x1="22" y1="44" x2="30" y2="36" stroke={L} strokeWidth="2.5" />
          {/* other leg extended */}
          <line x1="50" y1="59" x2="16" y2="62" stroke={B} strokeWidth="2.5" />
          {/* elbow to knee arrow */}
          <path d="M78 50 L30 38" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M33 36 L30 38 L33 41" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Russian Twist ─────────────────────────────────────────────────────────
    case "twist":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* hips on floor */}
          <circle cx="60" cy="64" r="5" fill={E} stroke={ES} strokeWidth="1" />
          {/* torso angled up */}
          <line x1="60" y1="62" x2="80" y2="40" stroke={L} strokeWidth="7" strokeLinecap="round" />
          {/* head */}
          <circle cx="85" cy="34" r="6.5" stroke={L} strokeWidth="1.5" />
          {/* legs angled up-left */}
          <line x1="60" y1="62" x2="32" y2="50" stroke={B} strokeWidth="5" strokeLinecap="round" />
          {/* arms holding weight to the side */}
          <line x1="74" y1="45" x2="58" y2="38" stroke={L} strokeWidth="2.5" />
          <circle cx="55" cy="36" r="5" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* arrows rotating */}
          <path d="M90 44 Q96 52 88 58" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M85 57 L88 58 L87 55" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Curl (Bicep / Hammer / Reverse) ───────────────────────────────────────
    case "curl":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* standing figure */}
          <circle cx="60" cy="12" r="8" stroke={B} strokeWidth="1.5" />
          <line x1="60" y1="20" x2="60" y2="44" stroke={B} strokeWidth="2" />
          {/* shoulders */}
          <line x1="44" y1="26" x2="76" y2="26" stroke={B} strokeWidth="2" />
          {/* right arm hanging */}
          <line x1="76" y1="26" x2="76" y2="50" stroke={B} strokeWidth="2" />
          {/* left arm curled */}
          <line x1="44" y1="26" x2="38" y2="48" stroke={B} strokeWidth="2" />
          <line x1="38" y1="48" x2="26" y2="36" stroke={L} strokeWidth="2.5" />
          {/* dumbbell */}
          <rect x="18" y="30" width="14" height="7" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* arrow */}
          <path d="M16 45 Q10 32 22 26" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M20 24 L22 26 L20 29" stroke={W} strokeWidth="1.5" />
          {/* legs */}
          <line x1="55" y1="44" x2="50" y2="68" stroke={B} strokeWidth="2" />
          <line x1="65" y1="44" x2="70" y2="68" stroke={B} strokeWidth="2" />
        </svg>
      );

    // ── Overhead Tricep Extension ─────────────────────────────────────────────
    case "overhead":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* standing figure */}
          <circle cx="60" cy="12" r="8" stroke={B} strokeWidth="1.5" />
          <line x1="60" y1="20" x2="60" y2="44" stroke={B} strokeWidth="2" />
          <line x1="44" y1="26" x2="76" y2="26" stroke={B} strokeWidth="2" />
          {/* arms overhead bent */}
          <line x1="50" y1="26" x2="50" y2="10" stroke={L} strokeWidth="2.5" />
          <line x1="70" y1="26" x2="70" y2="10" stroke={L} strokeWidth="2.5" />
          <line x1="50" y1="10" x2="70" y2="10" stroke={L} strokeWidth="2" />
          {/* forearms bent back */}
          <line x1="50" y1="10" x2="50" y2="24" stroke={L} strokeWidth="2.5" />
          <line x1="70" y1="10" x2="70" y2="24" stroke={L} strokeWidth="2.5" />
          {/* dumbbell behind head */}
          <rect x="48" y="20" width="24" height="8" rx="3" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* arrow up */}
          <path d="M60 8 L60 2" stroke={W} strokeWidth="1.5" />
          <path d="M57 5 L60 2 L63 5" stroke={W} strokeWidth="1.5" />
          {/* legs */}
          <line x1="55" y1="44" x2="50" y2="68" stroke={B} strokeWidth="2" />
          <line x1="65" y1="44" x2="70" y2="68" stroke={B} strokeWidth="2" />
        </svg>
      );

    // ── Wrist Curl ────────────────────────────────────────────────────────────
    case "wrist":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* seated — thigh horizontal */}
          <rect x="30" y="48" width="50" height="12" rx="6" stroke={B} strokeWidth="1.5" />
          {/* torso going up */}
          <line x1="72" y1="50" x2="80" y2="20" stroke={B} strokeWidth="6" strokeLinecap="round" />
          {/* head */}
          <circle cx="82" cy="13" r="7" stroke={B} strokeWidth="1.5" />
          {/* forearm on thigh */}
          <line x1="30" y1="48" x2="30" y2="44" stroke={L} strokeWidth="8" strokeLinecap="round" />
          <line x1="42" y1="48" x2="42" y2="44" stroke={L} strokeWidth="8" strokeLinecap="round" />
          <rect x="22" y="38" width="28" height="9" rx="4" stroke={L} strokeWidth="1.5" />
          {/* hand / wrist hanging down */}
          <line x1="28" y1="47" x2="28" y2="57" stroke={L} strokeWidth="2.5" />
          {/* dumbbell */}
          <rect x="20" y="55" width="16" height="7" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* arrows */}
          <path d="M20 58 L14 52" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M14 56 L14 52 L18 53" stroke={W} strokeWidth="1.5" />
          {/* legs down */}
          <line x1="35" y1="60" x2="28" y2="68" stroke={B} strokeWidth="2" />
          <line x1="55" y1="60" x2="60" y2="68" stroke={B} strokeWidth="2" />
        </svg>
      );

    // ── Goblet Squat ──────────────────────────────────────────────────────────
    case "squat":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* head */}
          <circle cx="60" cy="14" r="8" stroke={B} strokeWidth="1.5" />
          {/* torso */}
          <line x1="60" y1="22" x2="60" y2="44" stroke={B} strokeWidth="6" strokeLinecap="round" />
          {/* shoulders */}
          <line x1="46" y1="27" x2="74" y2="27" stroke={B} strokeWidth="2" />
          {/* arms holding DB at chest */}
          <line x1="46" y1="27" x2="46" y2="38" stroke={L} strokeWidth="2.5" />
          <line x1="74" y1="27" x2="74" y2="38" stroke={L} strokeWidth="2.5" />
          <rect x="44" y="36" width="32" height="10" rx="4" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* legs in squat */}
          <line x1="55" y1="44" x2="38" y2="58" stroke={L} strokeWidth="3" />
          <line x1="65" y1="44" x2="82" y2="58" stroke={L} strokeWidth="3" />
          <line x1="38" y1="58" x2="32" y2="68" stroke={L} strokeWidth="3" />
          <line x1="82" y1="58" x2="88" y2="68" stroke={L} strokeWidth="3" />
          {/* arrow up */}
          <path d="M100 55 L100 44" stroke={W} strokeWidth="1.5" />
          <path d="M97 47 L100 44 L103 47" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Lunge ─────────────────────────────────────────────────────────────────
    case "lunge":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* head */}
          <circle cx="70" cy="10" r="8" stroke={B} strokeWidth="1.5" />
          {/* torso upright */}
          <line x1="70" y1="18" x2="70" y2="40" stroke={B} strokeWidth="6" strokeLinecap="round" />
          <line x1="55" y1="24" x2="85" y2="24" stroke={B} strokeWidth="2" />
          {/* arms with dumbbells */}
          <line x1="55" y1="24" x2="52" y2="44" stroke={B} strokeWidth="2" />
          <line x1="85" y1="24" x2="88" y2="44" stroke={B} strokeWidth="2" />
          <rect x="44" y="42" width="12" height="6" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          <rect x="84" y="42" width="12" height="6" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* front leg bent */}
          <line x1="65" y1="40" x2="50" y2="54" stroke={L} strokeWidth="3" />
          <line x1="50" y1="54" x2="42" y2="68" stroke={L} strokeWidth="3" />
          {/* back leg back and knee near floor */}
          <line x1="75" y1="40" x2="88" y2="54" stroke={L} strokeWidth="3" />
          <line x1="88" y1="54" x2="96" y2="66" stroke={L} strokeWidth="3" />
          {/* knee near floor arrow */}
          <path d="M96 62 L100 68" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      );

    // ── Wall Sit ──────────────────────────────────────────────────────────────
    case "wall-sit":
      return (
        <svg {...C}>
          {/* wall */}
          <line x1="100" y1="4" x2="100" y2="68" stroke={FL} strokeWidth="3" />
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* head */}
          <circle cx="85" cy="12" r="8" stroke={B} strokeWidth="1.5" />
          {/* torso against wall */}
          <line x1="92" y1="20" x2="92" y2="48" stroke={B} strokeWidth="8" strokeLinecap="round" />
          {/* thighs horizontal */}
          <line x1="92" y1="46" x2="44" y2="46" stroke={L} strokeWidth="7" strokeLinecap="round" />
          {/* shins vertical */}
          <line x1="50" y1="48" x2="50" y2="68" stroke={L} strokeWidth="5" strokeLinecap="round" />
          <line x1="40" y1="48" x2="40" y2="68" stroke={L} strokeWidth="5" strokeLinecap="round" />
          {/* 90° angle indicator */}
          <path d="M50 48 L44 48 L44 54" stroke={W} strokeWidth="1.5" />
          {/* arms on thighs */}
          <line x1="84" y1="28" x2="70" y2="44" stroke={B} strokeWidth="2" />
          <line x1="92" y1="30" x2="78" y2="44" stroke={B} strokeWidth="2" />
        </svg>
      );

    // ── Calf Raise ────────────────────────────────────────────────────────────
    case "calf":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* head */}
          <circle cx="60" cy="10" r="8" stroke={B} strokeWidth="1.5" />
          {/* torso */}
          <line x1="60" y1="18" x2="60" y2="40" stroke={B} strokeWidth="6" strokeLinecap="round" />
          <line x1="46" y1="24" x2="74" y2="24" stroke={B} strokeWidth="2" />
          {/* arms with dumbbells */}
          <line x1="46" y1="24" x2="43" y2="48" stroke={B} strokeWidth="2" />
          <line x1="74" y1="24" x2="77" y2="48" stroke={B} strokeWidth="2" />
          <rect x="35" y="46" width="12" height="6" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          <rect x="73" y="46" width="12" height="6" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* legs — on tiptoe */}
          <line x1="55" y1="40" x2="52" y2="60" stroke={L} strokeWidth="3" />
          <line x1="65" y1="40" x2="68" y2="60" stroke={L} strokeWidth="3" />
          {/* feet raised */}
          <line x1="46" y1="68" x2="58" y2="60" stroke={L} strokeWidth="2.5" />
          <line x1="62" y1="68" x2="74" y2="60" stroke={L} strokeWidth="2.5" />
          {/* arrow up */}
          <path d="M60 36 L60 28" stroke={W} strokeWidth="1.5" />
          <path d="M57 31 L60 28 L63 31" stroke={W} strokeWidth="1.5" />
          {/* heel raised indicator */}
          <path d="M82 58 L90 62" stroke={W} strokeWidth="1" strokeDasharray="2 2" />
          <path d="M88 58 Q92 62 88 66" stroke={W} strokeWidth="1" fill="none" />
        </svg>
      );

    // ── Plank ─────────────────────────────────────────────────────────────────
    case "plank":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* body straight horizontal */}
          <line x1="20" y1="50" x2="100" y2="44" stroke={B} strokeWidth="10" strokeLinecap="round" />
          {/* head */}
          <circle cx="108" cy="40" r="7" stroke={B} strokeWidth="1.5" />
          {/* forearms on floor */}
          <line x1="28" y1="52" x2="22" y2="68" stroke={L} strokeWidth="3" />
          <line x1="40" y1="50" x2="34" y2="66" stroke={L} strokeWidth="3" />
          {/* elbow markers */}
          <circle cx="22" cy="68" r="3" fill={E} stroke={ES} strokeWidth="1" />
          <circle cx="34" cy="67" r="3" fill={E} stroke={ES} strokeWidth="1" />
          {/* toes on floor */}
          <circle cx="18" cy="54" r="3" fill={E} stroke={ES} strokeWidth="1" />
          {/* straight body indicator */}
          <path d="M60 38 L60 32" stroke={W} strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M57 35 L60 32 L63 35" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── Romanian Deadlift (hinge) ─────────────────────────────────────────────
    case "hinge":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* head */}
          <circle cx="104" cy="26" r="8" stroke={B} strokeWidth="1.5" />
          {/* torso — hinged forward, near horizontal */}
          <line x1="96" y1="32" x2="30" y2="40" stroke={B} strokeWidth="8" strokeLinecap="round" />
          {/* hips */}
          <circle cx="30" cy="40" r="5" fill={E} stroke={ES} strokeWidth="1" />
          {/* legs straight down */}
          <line x1="28" y1="44" x2="24" y2="68" stroke={L} strokeWidth="4" strokeLinecap="round" />
          <line x1="36" y1="44" x2="40" y2="68" stroke={L} strokeWidth="4" strokeLinecap="round" />
          {/* arms hanging with DBs */}
          <line x1="55" y1="38" x2="55" y2="56" stroke={L} strokeWidth="2.5" />
          <line x1="70" y1="37" x2="70" y2="55" stroke={L} strokeWidth="2.5" />
          <rect x="47" y="54" width="14" height="7" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          <rect x="62" y="53" width="14" height="7" rx="2" fill={E} stroke={ES} strokeWidth="1.5" />
          {/* hip hinge arrow */}
          <path d="M18 30 Q10 40 18 50" stroke={W} strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M15 49 L18 50 L18 47" stroke={W} strokeWidth="1.5" />
        </svg>
      );

    // ── V-sit ─────────────────────────────────────────────────────────────────
    case "vee":
      return (
        <svg {...C}>
          <line x1="8" y1="68" x2="112" y2="68" stroke={FL} strokeWidth="1.5" />
          {/* hips — balance point */}
          <circle cx="60" cy="62" r="5" fill={E} stroke={ES} strokeWidth="1" />
          {/* torso angled up-right */}
          <line x1="60" y1="60" x2="88" y2="32" stroke={L} strokeWidth="7" strokeLinecap="round" />
          {/* head */}
          <circle cx="93" cy="25" r="7" stroke={L} strokeWidth="1.5" />
          {/* legs angled up-left */}
          <line x1="60" y1="60" x2="26" y2="36" stroke={L} strokeWidth="6" strokeLinecap="round" />
          {/* feet */}
          <line x1="20" y1="34" x2="32" y2="30" stroke={L} strokeWidth="2.5" />
          {/* arms reaching toward feet */}
          <line x1="82" y1="38" x2="52" y2="44" stroke={B} strokeWidth="2.5" />
          <line x1="86" y1="33" x2="60" y2="38" stroke={B} strokeWidth="2.5" />
          {/* V angle indicator */}
          <path d="M60 62 L45 48" stroke={W} strokeWidth="1" strokeDasharray="2 2" />
          <path d="M60 62 L72 48" stroke={W} strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );

    default:
      return (
        <svg {...C}>
          <circle cx="60" cy="36" r="20" stroke={B} strokeWidth="1.5" />
          <line x1="60" y1="56" x2="60" y2="68" stroke={B} strokeWidth="2" />
        </svg>
      );
  }
}
