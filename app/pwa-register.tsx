"use client";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Unregister every old SW (including stale /sw.js), then register
    // /sw-v5.js which is a new filename the CDN has never cached.
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => navigator.serviceWorker.register("/sw-v5.js"))
      .then((reg) => {
        const sw = reg.installing ?? reg.waiting;
        if (sw) {
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
