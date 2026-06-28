"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./navItems";

/** Remove fundo branco do PNG via canvas */
function LogoSidebar() {
  const [src, setSrc] = useState("/logo.png");

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) d[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      setSrc(canvas.toDataURL("image/png"));
    };
    img.src = "/logo.png";
  }, []);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="NutriPlayer" className="h-[126px] w-auto object-contain" />;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
      {/* Logo — mesma altura da Topbar (72px) */}
      <Link
        href="/dashboard"
        className="flex h-[144px] shrink-0 items-center justify-center border-b border-[var(--color-border)]"
      >
        <LogoSidebar />
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "text-white shadow-[0_6px_16px_rgba(255,107,0,0.28)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
              )}
              style={active ? { background: "linear-gradient(135deg,#FF9A30,#FF6B00)" } : {}}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] px-5 py-3 text-[10px] text-[var(--color-muted)]">
        BH Wolves Manager
      </div>
    </aside>
  );
}
