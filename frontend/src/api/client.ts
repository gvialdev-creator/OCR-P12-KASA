import { ApiError } from "@/api/errors";

const apiBaseUrl = process.env.API_BASE_URL;

export async function apiFetch<T>(path: string): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError("La variable API_BASE_URL n'est pas configurée.");
  }

  let response: Response;

  try {
    response = await fetch(new URL(path, apiBaseUrl), { cache: "no-store" });
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