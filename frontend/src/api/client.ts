import { ApiError } from "@/api/errors";

const apiBaseUrl = process.env.API_BASE_URL;

interface ApiFetchOptions {
  revalidate?: number;
}

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