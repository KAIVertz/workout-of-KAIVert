"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",        label: "Aujourd'hui" },
  { href: "/history", label: "Historique"  },
];

export function TopNav({ inverted = false }: { inverted?: boolean }) {
  const path = usePathname();
  const dimColor = inverted ? "rgba(255,255,255,0.5)" : "#6b7280";
  const activeColor = inverted ? "#ffffff" : "#ffffff";
  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.15em", color: inverted ? "#fff" : "#fff" }}>
        KAI
      </span>
      <div style={{ display: "flex", gap: 24 }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href}
            style={{
              fontSize: 14,
              fontWeight: path === t.href ? 600 : 400,
              color: path === t.href ? activeColor : dimColor,
              textDecoration: "none",
              transition: "color 0.15s",
            }}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
