"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "TODAY", icon: "⚡" },
  { href: "/stats", label: "STATS", icon: "◈" },
  { href: "/history", label: "LOG", icon: "▤" },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent">
      <div className="max-w-md mx-auto">
        <div className="flex bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
          {TABS.map((tab) => {
            const active = path === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-center transition-all ${
                  active
                    ? "bg-white text-black"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="text-[10px] font-black tracking-widest leading-none">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
