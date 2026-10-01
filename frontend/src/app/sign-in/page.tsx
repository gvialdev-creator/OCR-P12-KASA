import type { Metadata } from "next";

import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Inscription | Kasa",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="container-app flex flex-1 items-center justify-center py-section">
      <section aria-labelledby="register-title" className="w-full max-w-139 rounded-lg border border-neutral-light-grey bg-neutral-white px-6 py-14 text-center sm:py-16">
        <h1 id="register-title" className="text-2xl font-bold text-brand-main-red">
          Rejoignez la communauté Kasa
        </h1>
        <p className="mx-auto mt-2 max-w-90 text-sm text-neutral-black">
          Créez votre compte et commencez à voyager autrement : réservez des logements uniques, découvrez de nouvelles destinations et partagez vos propres lieux avec d’autres voyageurs.
        </p>
        <RegisterForm />
      </section>
    </main>
  );
}