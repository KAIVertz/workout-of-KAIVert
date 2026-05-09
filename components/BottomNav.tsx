"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Aujourd'hui" },
  { href: "/history", label: "Historique" },
];

export function TopNav() {
  const path = usePathname();
  return (
    <nav className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-[#111]">
      <span className="text-white font-semibold text-sm">KAIVert</span>
      <div className="flex gap-5">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href}
            className={`text-sm transition-colors ${path === t.href ? "text-white font-medium" : "text-[#444]"}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// Keep old name for compatibility
export function BottomNav() { return <TopNav />; }
