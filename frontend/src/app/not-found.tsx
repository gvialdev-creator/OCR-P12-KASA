import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-app flex flex-1 items-center justify-center py-section">
      <section
        aria-labelledby="not-found-title"
        className="flex w-full max-w-md flex-col items-center text-center"
      >
        <h1
          id="not-found-title"
          className="text-8xl font-black leading-none text-brand-main-red"
        >
          404
        </h1>
        <p className="mt-5 max-w-sm text-sm text-neutral-black">
          Il semble que la page que vous cherchez ait pris des vacances… ou n’ait jamais existé.
        </p>
        <nav
          aria-label="Navigation après une erreur 404"
          className="mt-8 flex w-38 flex-col gap-2"
        >
          <ButtonLink
            href="/"
          >
            Accueil
          </ButtonLink>
          <ButtonLink
            href="/logements"
          >
            Logements
          </ButtonLink>
        </nav>
      </section>
    </main>
  );
}