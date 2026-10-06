import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AccountForms } from "@/features/account/components/account-forms";
import { getSessionUser } from "@/features/auth/services/has-valid-session";

export const metadata: Metadata = {
  title: "Mon compte | Kasa",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!user) redirect("/login");

  const [givenName = "", ...familyNameParts] = user.name.trim().split(/\s+/);

  return (
    <main className="container-app flex-1 py-section sm:max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold text-brand-main-red">Mon compte</h1>
      <AccountForms
        user={user}
        givenName={givenName}
        familyName={familyNameParts.join(" ")}
      />
    </main>
  );
}