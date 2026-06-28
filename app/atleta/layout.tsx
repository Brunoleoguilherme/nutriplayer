import { Toaster } from "react-hot-toast";

/** Moldura mobile-first do app do atleta. */
export default function AtletaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--color-bg)]">
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-surface-2)",
            color: "var(--color-fg)",
            border: "1px solid var(--color-border)",
          },
        }}
      />
    </div>
  );
}
