import { ApiError } from "@/api/errors";

const apiBaseUrl = process.env.API_BASE_URL;

/** Options de cache pour une requête API serveur. */
export interface ApiFetchOptions {
  /** Cache public en secondes ; absent ou nul, la réponse utilise `no-store`. */
  revalidate?: number;
}

/**
 * Appelle l’API Express depuis le serveur Next.js et retourne son corps JSON.
 * Les appels sont non mis en cache par défaut ; ne demander une revalidation
 * que pour des données publiques dont le délai de fraîcheur est acceptable.
 *
 * @throws {ApiError} Si l’URL API manque, si le réseau échoue ou si l’API répond en erreur.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError("La variable API_BASE_URL n'est pas configurée.");
  }

  let response: Response;

  try {
    const requestOptions = options.revalidate
      ? { next: { revalidate: options.revalidate } }
      : { cache: "no-store" as const };
    response = await fetch(new URL(path, apiBaseUrl), requestOptions);
  } catch {
    throw new ApiError(`Impossible de joindre l'API à l'adresse ${apiBaseUrl}.`);
  }

  if (!response.ok) {
    throw new ApiError(
      `L'API a répondu avec le statut ${response.status}.`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}