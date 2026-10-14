import type { PropertyDetail } from "@/domain/types/property";

/**
 * Construit le JSON-LD Accommodation à partir des seules données disponibles
 * sur la fiche visible; les images sont dédupliquées et les champs absents omis.
 */
export function buildAccommodationStructuredData(
  property: PropertyDetail,
  siteUrl?: string,
) {
  const images = Array.from(
    new Set([property.cover, ...property.pictures].filter((image): image is string => Boolean(image))),
  );
  const description =
    property.description?.trim() || "Aucune description n’est disponible pour ce logement.";
  const address = {
    "@type": "PostalAddress",
    ...(property.postal_code && { postalCode: property.postal_code }),
    ...(property.location && { addressLocality: property.location }),
  };
  const propertyUrl = siteUrl
    ? `${siteUrl}/properties/${encodeURIComponent(property.slug)}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    identifier: property.id,
    name: property.title,
    description,
    ...(images.length > 0 && { image: images }),
    ...((property.postal_code || property.location) && { address }),
    ...(propertyUrl && { url: propertyUrl }),
  };
}