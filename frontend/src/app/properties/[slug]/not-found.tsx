import Link from "next/link";

import { ArrowLeftIcon } from "@/components/ui/icons";

export default function PropertyNotFound() {
  return (
    <main className="container-app flex flex-1 items-center justify-center py-section">
      <div className="rounded-lg bg-neutral-white p-page text-center shadow-card">
        <h1 className="text-2xl font-bold text-brand-main-red">Logement introuvable</h1>
        <p className="mt-3 text-neutral-dark-grey">
          Ce logement n’existe pas ou n’est plus disponible.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center gap-1 rounded-lg bg-neutral-light-grey px-4 text-sm text-neutral-dark-grey hover:text-brand-main-red"
        >
          <ArrowLeftIcon className="size-4" />
          Retour aux annonces
        </Link>
      </div>
    </main>
  );
}