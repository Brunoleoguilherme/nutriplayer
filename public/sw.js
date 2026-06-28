// NutriPlay Service Worker — offline app-shell + push notifications
const CACHE = "nutriplay-v2";
const APP_SHELL = ["/atleta", "/manifest.webmanifest", "/icon.svg"];

// Rotas que NUNCA devem ser interceptadas pelo SW
function deveIgnorar(url) {
  const { origin, pathname } = url;
  if (origin !== self.location.origin) return true;   // externas (Supabase, etc.)
  if (pathname.startsWith("/api/")) return true;       // API routes
  if (pathname.startsWith("/_next/")) return false;    // assets Next.js — pode cachear
  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (deveIgnorar(url)) return; // deixa o browser resolver sem intervenção

  if (request.mode === "navigate") {
    // Navegação: network-first, fallback para cache, fallback para /atleta
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? (await caches.match("/atleta")) ?? new Response("Offline", { status: 503 });
        }),
    );
    return;
  }

  // Assets estáticos: cache-first, atualiza em background
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        // Revalida em background (stale-while-revalidate)
        fetch(request)
          .then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(request, res));
          })
          .catch(() => {/* offline, tudo bem */});
        return cached;
      }
      // Não está no cache — busca na rede
      try {
        const res = await fetch(request);
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      } catch {
        // Recurso não disponível offline — retorna 408 silencioso
        return new Response("", { status: 408, statusText: "Request Timeout" });
      }
    }),
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  let data = { title: "NutriPlayer", body: "Você tem uma atualização." };
  try {
    if (event.data) data = event.data.json();
  } catch { /* payload texto simples */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      badge: "/icon.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/atleta"));
});
