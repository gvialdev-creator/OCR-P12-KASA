import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/api/errors";
import { ArrowLeftIcon } from "@/components/ui/icons";
import type { PropertyDetail } from "@/domain/types/property";
import { PropertyDetailView } from "@/features/properties/components/property-detail-view";
import { getPropertyDetail } from "@/features/properties/services/get-property-detail";

export const dynamic = "force-dynamic";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

type PropertyResult =
  | { property: PropertyDetail; state: "success" }
  | { property: null; state: "not-found" | "error" };

async function loadProperty(id: string): Promise<PropertyResult> {
  try {
    const property = await getPropertyDetail(id);
    return { property, state: "success" };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { property: null, state: "not-found" };
    }
    return { property: null, state: "error" };
  }
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await loadProperty(id);

  if (result.state !== "success") return { title: "Logement | Kasa" };

  return {
    title: `${result.property.title} | Kasa`,
    description: result.property.description ?? `Découvrez ${result.property.title} sur Kasa.`,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const result = await loadProperty(id);

  if (result.state === "not-found") notFound();

  return (
    <main className="container-app flex-1 py-section">
      <Link
        href="/"
        className="mb-component inline-flex h-9 items-center gap-1 rounded-lg bg-neutral-light-grey px-4 text-sm text-neutral-dark-grey transition-colors hover:text-brand-main-red"
      >
        <ArrowLeftIcon className="size-4" />
        Retour aux annonces
      </Link>

      {result.state === "success" ? (
        <PropertyDetailView property={result.property} />
      ) : (
        <div role="alert" className="rounded-lg bg-neutral-white p-page text-center shadow-card">
          <h1 className="text-xl font-bold text-brand-main-red">
            Le logement ne peut pas être chargé
          </h1>
          <p className="mt-2 text-neutral-dark-grey">
            Veuillez réessayer dans quelques instants.
          </p>
        </div>
      )}
    </main>
  );
}