import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasValidSession } from "@/features/auth/services/has-valid-session";

export const metadata: Metadata = {
  title: "Mon compte | Kasa",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  if (!await hasValidSession((await cookies()).get("kasa_session")?.value)) {
    redirect("/login");
  }

  return (
    <main className="container-app flex-1 py-section">
      <h1 className="text-2xl font-bold text-brand-main-red">Mon compte</h1>
    </main>
  );
}