import type { MetadataRoute } from "next";

import { getProperties } from "@/features/properties/services/get-properties";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");

  if (!siteUrl) return [];

  const properties = await getProperties();

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...properties.map((property) => ({
      url: `${siteUrl}/properties/${encodeURIComponent(property.id)}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}