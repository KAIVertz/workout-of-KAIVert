"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",        label: "Today"   },
  { href: "/stats",   label: "Stats"   },
  { href: "/history", label: "History" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-[#111]">
      <div className="max-w-md mx-auto flex">
        {TABS.map((tab) => {
          const active = path === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 py-4 text-center text-sm transition-colors ${
                active ? "text-white font-medium" : "text-[#444] hover:text-[#777]"
              }`}>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
