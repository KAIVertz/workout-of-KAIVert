"use client";
import { useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function subscribePush(reg: ServiceWorkerRegistration) {
  if (!VAPID_PUBLIC_KEY) return;
  try {
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))) } }),
    });
  } catch {}
}

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => navigator.serviceWorker.register("/sw-v5.js"))
      .then(async (reg) => {
        if (!("Notification" in window) || !VAPID_PUBLIC_KEY) return;
        if (Notification.permission === "granted") {
          await subscribePush(reg);
        } else if (Notification.permission === "default") {
          // Defer permission request — called from app after user gesture
          (window as Window & { __pushReg?: ServiceWorkerRegistration }).__pushReg = reg;
        }
      })
      .catch(console.error);
  }, []);

  return null;
}

// Called from the app after a user gesture (e.g. starting workout)
export async function requestPushPermission() {
  if (!("Notification" in window) || !VAPID_PUBLIC_KEY) return;
  if (Notification.permission === "granted") return;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return;
  const reg = (window as Window & { __pushReg?: ServiceWorkerRegistration }).__pushReg
    ?? await navigator.serviceWorker.ready;
  await subscribePush(reg);
}
