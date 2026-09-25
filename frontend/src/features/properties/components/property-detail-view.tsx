import type { PropertyDetail } from "@/domain/types/property";

import { PropertyCarousel } from "./property-carousel";
import { PropertyHostCard } from "./property-host-card";
import { PropertyInformation } from "./property-information";

interface PropertyDetailViewProps {
  property: PropertyDetail;
}

export function PropertyDetailView({ property }: PropertyDetailViewProps) {
  const images = Array.from(
    new Set([property.cover, ...property.pictures].filter((image): image is string => Boolean(image))),
  );

  return (
    <div className="grid items-start gap-component lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="grid gap-component">
        <PropertyCarousel images={images} title={property.title} />
        <PropertyInformation property={property} />
      </div>
      <PropertyHostCard property={property} />
    </div>
  );
}