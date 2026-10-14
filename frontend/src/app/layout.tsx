import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Props du layout racine partagé par les routes de l’application. */
export interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "Kasa",
  description: "Application de location immobilière Kasa",
  ...(process.env.SITE_URL && {
    metadataBase: new URL(process.env.SITE_URL),
  }),
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-brand-light-orange">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
