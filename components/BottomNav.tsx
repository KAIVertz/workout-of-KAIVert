"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Aujourd'hui" },
  { href: "/history", label: "Historique" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-[#111]">
      <div className="flex max-w-md mx-auto">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href}
            className={`flex-1 py-4 text-center text-sm transition-colors ${path === t.href ? "text-white font-medium" : "text-[#444]"}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
