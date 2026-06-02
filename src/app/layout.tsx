import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoviTrans — Gestión de Transporte Ganadero",
  description: "Plataforma logística para el transporte terrestre de ganado vacuno",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F7FAF8]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
