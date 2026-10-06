import type { Property } from "@/domain/types/property";

import { PropertyCard } from "./property-card";

interface PropertyGridProps {
  properties: Property[];
  favoriteIds?: string[];
  isAuthenticated?: boolean;
}

export function PropertyGrid({ properties, favoriteIds = [], isAuthenticated = false }: PropertyGridProps) {
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
          isFavorite={favoriteIds.includes(property.id)}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}