"use client";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Unregister stale SWs, then register the passthrough sw-v5.js.
    // No reload needed — sw-v5 has no fetch handler so it never serves
    // cached content. The browser goes straight to the network always.
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => navigator.serviceWorker.register("/sw-v5.js"))
      .catch(console.error);
  }, []);

  return null;
}
