import type { Property } from "@/domain/types/property";

import { PropertyCard } from "./property-card";

interface PropertyGridProps {
  properties: Property[];
}

export function PropertyGrid({ properties }: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <p className="rounded-md bg-neutral-white p-page text-center text-neutral-dark-grey shadow-card">
        Aucun logement disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="grid gap-component sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
        />
      ))}
    </div>
  );
}