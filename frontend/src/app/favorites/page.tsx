import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { getUserFavorites } from "@/features/favorites/services/favorites";
import { PropertyGrid } from "@/features/properties/components/property-grid";

export const metadata: Metadata = {
  title: "Vos favoris | Kasa",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!user || !token) redirect(`/login?returnTo=${encodeURIComponent("/favorites")}`);

  let favorites;
  try {
    favorites = await getUserFavorites(user.id, token);
  } catch {
    return (
      <main className="container-app flex-1 py-section">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-brand-main-red">Vos favoris</h1>
          <p className="mt-3 text-sm text-neutral-dark-grey">Retrouvez ici tous les logements que vous avez aimés.</p>
        </header>
        <p role="alert" className="rounded-md bg-neutral-white p-page text-center text-sm text-brand-main-red shadow-card">
          Vos favoris ne peuvent pas être chargés pour le moment. Réessayez plus tard.
        </p>
      </main>
    );
  }

  return (
    <main className="container-app flex-1 py-section">
      <header className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-brand-main-red">Vos favoris</h1>
        <p className="mt-3 text-sm text-neutral-dark-grey">
          Retrouvez ici tous les logements que vous avez aimés.<br className="hidden sm:block" />
          Prêts à réserver ? Un simple clic et votre prochain séjour est en route.
        </p>
      </header>

      {favorites.length > 0 ? (
        <PropertyGrid
          properties={favorites}
          favoriteIds={favorites.map((property) => property.id)}
          isAuthenticated
        />
      ) : (
        <section className="mx-auto max-w-lg rounded-md bg-neutral-white px-6 py-10 text-center shadow-card">
          <h2 className="text-lg font-semibold text-neutral-black">Aucun favori pour le moment</h2>
          <p className="mt-2 text-sm text-neutral-dark-grey">Ajoutez un logement à vos favoris pour le retrouver ici.</p>
          <ButtonLink href="/">Découvrir les logements</ButtonLink>
        </section>
      )}
    </main>
  );
}