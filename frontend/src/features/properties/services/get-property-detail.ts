import { apiFetch } from "@/api/client";
import type { PropertyDetail } from "@/domain/types/property";

/** Charge une fiche par slug avec revalidation Next après une heure. */
export function getPropertyDetail(slug: string): Promise<PropertyDetail> {
  return apiFetch<PropertyDetail>(
    `/api/properties/slug/${encodeURIComponent(slug)}`,
    { revalidate: 3600 },
  );
}