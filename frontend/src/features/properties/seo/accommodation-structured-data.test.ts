import { describe, expect, it } from "vitest";

import type { PropertyDetail } from "@/domain/types/property";

import { buildAccommodationStructuredData } from "./accommodation-structured-data";

const property: PropertyDetail = {
  id: "property-1",
  slug: "studio-nice",
  title: "Studio à Nice",
  description: "Vue sur mer",
  cover: "/uploads/cover.jpg",
  pictures: ["/uploads/cover.jpg", "/uploads/room.jpg"],
  location: "Nice",
  postal_code: "06000",
  price_per_night: 120,
  rating_avg: 4.6,
  ratings_count: 12,
  equipments: [],
  tags: [],
};

describe("buildAccommodationStructuredData", () => {
  it("includes visible property data and deduplicates its images", () => {
    expect(buildAccommodationStructuredData(property, "https://kasa.example")).toEqual({
      "@context": "https://schema.org",
      "@type": "Accommodation",
      identifier: "property-1",
      name: "Studio à Nice",
      description: "Vue sur mer",
      image: ["/uploads/cover.jpg", "/uploads/room.jpg"],
      address: {
        "@type": "PostalAddress",
        postalCode: "06000",
        addressLocality: "Nice",
      },
      url: "https://kasa.example/properties/studio-nice",
    });
  });

  it("uses the visible description fallback and omits unavailable data", () => {
    const result = buildAccommodationStructuredData({
      ...property,
      description: "  ",
      cover: null,
      pictures: [],
      location: null,
      postal_code: null,
    });

    expect(result.description).toBe("Aucune description n’est disponible pour ce logement.");
    expect(result).not.toHaveProperty("image");
    expect(result).not.toHaveProperty("address");
    expect(result).not.toHaveProperty("url");
    expect(result).not.toHaveProperty("offers");
    expect(result).not.toHaveProperty("aggregateRating");
  });
});