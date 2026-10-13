import { apiFetch } from "@/api/client";
import type { PropertyDetail } from "@/domain/types/property";

export function getPropertyDetail(slug: string): Promise<PropertyDetail> {
  return apiFetch<PropertyDetail>(
    `/api/properties/slug/${encodeURIComponent(slug)}`,
  );
}