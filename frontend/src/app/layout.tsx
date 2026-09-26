import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kasa",
  description: "Application de location immobilière Kasa",
  ...(process.env.SITE_URL && {
    metadataBase: new URL(process.env.SITE_URL),
  }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col bg-brand-light-orange">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
