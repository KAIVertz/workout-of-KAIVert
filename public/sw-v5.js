// v5 — no fetch caching, push notifications + workout lock screen actions
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (e) => {
  let data = { title: "KAIVert", body: "Rappel séance", icon: "/icon" };
  try { data = { ...data, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/apple-icon",
      tag: data.tag || "kaivert",
      renotify: true,
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  // ── Workout action: mark set done ──
  if (e.action === "set-done") {
    const d = e.notification.data;
    e.waitUntil(
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: d.session_id,
          exercise_name: d.exercise_name,
          set_number: d.set_number,
          reps: d.reps,
          weight_kg: d.weight_kg,
        }),
      }).then(async () => {
        // Sync the app if it's open in background
        const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
        const app = allClients.find((w) => w.url.includes(self.location.origin));
        if (app) {
          app.postMessage({
            type: "SET_DONE",
            exercise_name: d.exercise_name,
            set_number: d.set_number,
            reps: d.reps,
            weight_kg: d.weight_kg,
          });
        }
        // Show next set notification
        const nextSet = d.set_number + 1;
        if (nextSet <= d.sets_total) {
          return self.registration.showNotification(
            `Série ${nextSet}/${d.sets_total} — ${d.exercise_name}`,
            {
              body: `${d.reps} reps${d.weight_kg > 0 ? " · " + d.weight_kg + "kg" : ""}`,
              tag: "workout-active",
              silent: true,
              renotify: false,
              actions: [{ action: "set-done", title: "✓ Série faite" }],
              data: { ...d, set_number: nextSet },
            }
          );
        } else {
          return self.registration.showNotification(d.exercise_name + " terminé !", {
            body: "Ouvre l'app pour l'exercice suivant.",
            tag: "workout-active",
            silent: false,
            data: { url: "/" },
          });
        }
      }).catch(() => {})
    );
    return;
  }

  // ── Default: open app ──
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
      const open = ws.find((w) => w.url.includes(self.location.origin));
      if (open) return open.focus();
      return clients.openWindow(e.notification.data?.url || "/");
    })
  );
});
