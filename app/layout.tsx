import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/pwa/RegisterSW";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NutryPlayer — Nutrição Esportiva",
  description:
    "Plataforma de nutrição esportiva do ecossistema BH Wolves Manager.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "NutryPlayer", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#fff8f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
