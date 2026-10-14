import { apiFetch } from "@/api/client";
import type { Property } from "@/domain/types/property";

/** Charge la liste publique des logements; la réponse utilise no-store par défaut. */
export function getProperties(): Promise<Property[]> {
  return apiFetch<Property[]>("/api/properties");
}