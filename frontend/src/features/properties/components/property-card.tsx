import Image from "next/image";
import Link from "next/link";

import { HeartIcon } from "@/components/ui/icons";
import type { Property } from "@/domain/types/property";

interface PropertyCardProps {
  property: Property;
}

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function PropertyCard({
  property,
}: PropertyCardProps) {
  const imageAlt = property.location
    ? `Photo de ${property.title}, ${property.location}`
    : `Photo de ${property.title}`;

  return (
    <article className="group h-full overflow-hidden rounded-md bg-neutral-white shadow-card transition-shadow hover:shadow-card-hover">
      <Link href={`/properties/${property.id}`} className="block h-full">
        <div className="relative aspect-4/3 overflow-hidden bg-neutral-light-grey">
          {property.cover ? (
            <Image
              src={property.cover}
              alt={imageAlt}
              fill
              sizes="(max-width: 639px) calc(100vw - 48px), (max-width: 1023px) calc(50vw - 32px), 368px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-neutral-dark-grey">
              Aucune photo disponible pour {property.title}
            </div>
          )}

          <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-neutral-white text-brand-main-red shadow-card">
            <HeartIcon className="size-4" />
          </span>
        </div>

        <div className="p-component">
          <h2 className="line-clamp-2 font-bold text-neutral-black">
            {property.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-dark-grey">
            {property.location ?? "Localisation non renseignée"}
          </p>

          <div className="mt-component flex items-end justify-between gap-4 text-sm">
            <p className="font-medium text-neutral-black">
              {priceFormatter.format(property.price_per_night)} / nuit
            </p>
            
          </div>
        </div>
      </Link>
    </article>
  );
}