"use client";
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Versioned URL forces the browser to treat this as a new SW
    // even if the old sw.js was cached with a long CDN TTL
    navigator.serviceWorker.register("/sw.js?v=4")
      .then(() => {
        // When a new SW takes control (after skipWaiting + clients.claim),
        // reload the page so the browser fetches fresh assets
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      })
      .catch(console.error);
  }, []);

  return null;
}
