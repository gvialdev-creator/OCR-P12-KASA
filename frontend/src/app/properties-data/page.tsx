import Image from "next/image";

import type { Property } from "@/domain/types/property";
import { getProperties } from "@/features/properties/services/get-properties";

export const dynamic = "force-dynamic";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type PropertiesResult =
  | { properties: Property[]; error: null }
  | { properties: null; error: string };

async function loadProperties(): Promise<PropertiesResult> {
  try {
    const properties = await getProperties();

    return { properties, error: null };
  } catch (error) {
    return {
      properties: null,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue.",
    };
  }
}

export default async function PropertiesDataPage() {
  const result = await loadProperties();

  if (result.properties === null) {
    return (
      <main className="container-app py-section">
        <div className="rounded-md border border-brand-main-red bg-brand-light-orange p-page">
          <h1 className="text-xl font-bold text-brand-main-red">
            API indisponible
          </h1>
          <p className="mt-2">{result.error}</p>
          <p className="mt-2 text-sm text-neutral-dark-grey">
            Vérifiez que le backend est démarré sur le port configuré dans
            API_BASE_URL.
          </p>
        </div>
      </main>
    );
  }

  const { properties } = result;

  return (
      <main className="container-app py-section">
        <header className="mb-section">
          <p className="text-sm font-medium text-brand-main-red">
            Données temporaires
          </p>
          <h1 className="mt-1 text-3xl font-bold">Propriétés de l’API</h1>
          <p className="mt-2 text-neutral-dark-grey">
            {properties.length} propriété{properties.length > 1 ? "s" : ""} reçue
            {properties.length > 1 ? "s" : ""} du backend.
          </p>
        </header>

        <section aria-labelledby="properties-grid-title">
          <h2 id="properties-grid-title" className="sr-only">
            Liste des propriétés
          </h2>
          <div className="grid gap-component sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <article
                key={property.id}
                className="overflow-hidden rounded-md border border-neutral-light-grey bg-neutral-white shadow-card"
              >
                <div className="relative aspect-4/3 bg-neutral-light-grey">
                  {property.cover ? (
                    <Image
                      src={property.cover}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-dark-grey">
                      Aucune image
                    </div>
                  )}
                </div>

                <div className="p-component">
                  <h3 className="font-bold">{property.title}</h3>
                  <p className="mt-1 text-sm text-neutral-dark-grey">
                    {property.location ?? "Localisation non renseignée"}
                  </p>
                  <dl className="mt-component grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-neutral-dark-grey">Prix</dt>
                      <dd className="font-medium">
                        {priceFormatter.format(property.price_per_night)} / nuit
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-dark-grey">Note</dt>
                      <dd className="font-medium">
                        {property.rating_avg}/5 ({property.ratings_count})
                      </dd>
                    </div>
                  </dl>
                  {property.host && (
                    <p className="mt-component text-sm">
                      Hôte : {property.host.name}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-section" aria-labelledby="raw-data-title">
          <h2 id="raw-data-title" className="text-xl font-bold">
            Réponse JSON
          </h2>
          <pre className="mt-component max-h-160 overflow-auto rounded-md bg-neutral-black p-component text-xs text-neutral-white">
            {JSON.stringify(properties, null, 2)}
          </pre>
        </section>
      </main>
  );
}