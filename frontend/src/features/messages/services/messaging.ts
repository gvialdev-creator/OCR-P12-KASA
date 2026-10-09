import { ApiError } from "@/api/errors";

export async function messagingRequest<T>(path: string, token: string, method = "GET", body?: unknown): Promise<T> {
  if (!process.env.API_BASE_URL) throw new ApiError("La messagerie n'est pas configurée.");
  let response: Response;
  try {
    response = await fetch(new URL(`/api${path}`, process.env.API_BASE_URL), {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store", body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw new ApiError("Impossible de joindre la messagerie. Réessayez."); }
  if (!response.ok) {
    if (response.status === 404 && method === "POST" && path === "/conversations") {
      const isApiResponse = response.headers.get("content-type")?.includes("application/json");
      throw new ApiError(isApiResponse
        ? "Le destinataire de cette conversation n'est pas disponible."
        : "La route de messagerie est indisponible. Redémarrez le backend pour charger les nouvelles routes.", 404);
    }
    const errors: Record<number, string> = {
      400: "Ce message ou cette demande n'est pas valide.",
      401: "Votre session a expiré.",
      403: "Cette conversation est privée.",
      404: "Cette conversation n'est pas disponible.",
      409: "Cet envoi existe déjà avec un autre contenu.",
      429: "Trop de demandes. Patientez une minute avant de réessayer.",
    };
    throw new ApiError(errors[response.status] || "La messagerie est temporairement indisponible.", response.status);
  }
  return response.json() as Promise<T>;
}