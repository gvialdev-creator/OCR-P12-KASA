import { apiFetch } from "@/api/client";
import type { Property } from "@/domain/types/property";

export function getProperties(): Promise<Property[]> {
  return apiFetch<Property[]>("/api/properties");
}