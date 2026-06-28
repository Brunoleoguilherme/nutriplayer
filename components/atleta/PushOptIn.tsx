"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import toast from "react-hot-toast";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Opt-in de notificações push.
 * Pré-requisitos para ENVIO (backend):
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY no .env
 *   - rota /api/push/subscribe persistindo a subscription
 *   - serviço servidor com web-push + chave VAPID privada para disparar
 */
export function PushOptIn({ atletaId }: { atletaId: string }) {
  const [estado, setEstado] = useState<"idle" | "on" | "off" | "unsupported">("idle");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setEstado("unsupported");
      return;
    }
    setEstado(Notification.permission === "granted" ? "on" : "off");
  }, []);

  async function ativar() {
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        toast.error("Permissão negada");
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const reg = await navigator.serviceWorker.ready;

      if (vapid) {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ atletaId, subscription: sub }),
        }).catch(() => {});
      }
      setEstado("on");
      toast.success("Notificações ativadas");
    } catch {
      toast.error("Não foi possível ativar");
    }
  }

  if (estado === "unsupported") return null;

  return (
    <button
      onClick={estado === "on" ? undefined : ativar}
      disabled={estado === "on"}
      className="card flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-70"
    >
      {estado === "on" ? (
        <Bell className="h-5 w-5 text-[var(--color-brand-green)]" />
      ) : (
        <BellOff className="h-5 w-5 text-[var(--color-muted)]" />
      )}
      <div className="flex-1">
        <div className="text-sm font-medium">
          {estado === "on" ? "Notificações ativadas" : "Ativar notificações"}
        </div>
        <div className="text-xs text-[var(--color-muted)]">
          Lembretes de hidratação, refeições e game day.
        </div>
      </div>
    </button>
  );
}
