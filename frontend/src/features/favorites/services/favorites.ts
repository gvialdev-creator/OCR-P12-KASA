import { ApiError } from "@/api/errors";
import type { Property } from "@/domain/types/property";

function apiUrl(path: string): URL {
  if (!process.env.API_BASE_URL) throw new ApiError("Le service des favoris est indisponible.");
  return new URL(path, process.env.API_BASE_URL);
}

export async function getUserFavorites(userId: number, token: string): Promise<Property[]> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/users/${userId}/favorites`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de charger vos favoris.");
  }
  if (!response.ok) throw new ApiError("Impossible de charger vos favoris.", response.status);
  return response.json() as Promise<Property[]>;
}

export async function setPropertyFavorite(
  propertyId: string,
  favorite: boolean,
  token: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/properties/${encodeURIComponent(propertyId)}/favorite`), {
      method: favorite ? "POST" : "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de modifier ce favori.");
  }
  if (!response.ok) throw new ApiError("Impossible de modifier ce favori.", response.status);
}