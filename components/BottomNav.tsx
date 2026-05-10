"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Aujourd'hui" },
  { href: "/history", label: "Historique" },
];

export function TopNav({ light = false }: { light?: boolean }) {
  const path = usePathname();
  const base = light ? "text-white/60 hover:text-white" : "text-[#444] hover:text-white";
  const active = light ? "text-white font-semibold" : "text-white font-semibold";
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm font-bold tracking-widest uppercase ${light ? "text-white" : "text-white"}`}>
        KAI
      </span>
      <div className="flex gap-6">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href}
            className={`text-sm transition-colors ${path === t.href ? active : base}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BottomNav() { return null; }
