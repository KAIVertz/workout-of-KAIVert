"use client";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Unregister every existing SW (clears stale cached versions),
    // then register a fresh one. The new SW has no fetch handler so
    // the browser always goes straight to the network.
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => navigator.serviceWorker.register("/sw.js?v5"))
      .then((reg) => {
        const sw = reg.installing ?? reg.waiting ?? reg.active;
        if (sw && sw.state !== "activated") {
          sw.addEventListener("statechange", (e) => {
            if ((e.target as ServiceWorker).state === "activated") {
              window.location.reload();
            }
          });
        }
      })
      .catch(console.error);
  }, []);

  return null;
}
