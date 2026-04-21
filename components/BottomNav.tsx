"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",       label: "Today"  },
  { href: "/stats",  label: "Stats"  },
  { href: "/history",label: "History"},
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808] border-t border-[#1a1a1a]">
      <div className="max-w-md mx-auto flex pb-safe">
        {TABS.map((tab) => {
          const active = path === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-3.5 text-center transition-colors ${
                active ? "text-white" : "text-[#444] hover:text-[#777]"
              }`}
            >
              <span className={`text-sm font-semibold ${active ? "text-white" : ""}`}>
                {tab.label}
              </span>
              {active && <span className="w-1 h-1 rounded-full bg-white mt-1" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
