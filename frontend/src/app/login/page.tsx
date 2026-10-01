import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { hasValidSession } from "@/features/auth/services/has-valid-session";

export const metadata: Metadata = {
  title: "Connexion | Kasa",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await hasValidSession((await cookies()).get("kasa_session")?.value)) {
    redirect("/");
  }

  const { registered } = await searchParams;

  return (
    <main className="container-app flex flex-1 items-center justify-center py-section">
      <section aria-labelledby="login-title" className="w-full max-w-139 rounded-lg border border-neutral-light-grey bg-neutral-white px-6 py-14 text-center sm:py-16">
        <h1 id="login-title" className="text-2xl font-bold text-brand-main-red">
          Heureux de vous revoir
        </h1>
        <p className="mx-auto mt-2 max-w-70 text-sm text-neutral-black">
          Connectez-vous pour retrouver vos réservations, vos annonces et tout ce qui rend vos séjours uniques.
        </p>
        {registered === "1" && (
          <p role="status" className="mx-auto mt-6 max-w-70 text-sm text-neutral-dark-grey">
            Inscription réussie. Vous pouvez vous connecter.
          </p>
        )}
        <LoginForm />
      </section>
    </main>
  );
}