"use client";

import { useEffect } from "react";

/** Registra o service worker (offline + base para push). */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* silencioso: app funciona sem SW */
      });
    }
  }, []);
  return null;
}
