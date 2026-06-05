import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import Sidebar from "@/components/organisms/Sidebar";
import AxeDevTools from "@/components/atoms/AxeDevTools";

interface RootLayoutProps {
  children: React.ReactNode;
}

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoviTrans — Gestión de Transporte Ganadero",
  description: "Plataforma logística para el transporte terrestre de ganado vacuno",
};

const RootLayout = async ({ children }: RootLayoutProps) => {
  const messages = await getMessages();
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#F7FAF8]">
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1">{children}</main>
          </div>
          {process.env.NODE_ENV !== "production" && <AxeDevTools />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export default RootLayout;
