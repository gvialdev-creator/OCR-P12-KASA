import { apiFetch } from "@/api/client";
import type { PropertyDetail } from "@/domain/types/property";

export function getPropertyDetail(id: string): Promise<PropertyDetail> {
  return apiFetch<PropertyDetail>(`/api/properties/${encodeURIComponent(id)}`);
}