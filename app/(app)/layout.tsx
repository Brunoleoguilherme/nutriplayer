import { Toaster } from "react-hot-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
      <Toaster
        position="bottom-right"
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
