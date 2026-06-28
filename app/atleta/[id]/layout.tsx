import { BottomNav } from "@/components/atleta/BottomNav";

export default async function AtletaIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-1 flex-col pb-24">
      {children}
      <BottomNav atletaId={id} />
    </div>
  );
}
