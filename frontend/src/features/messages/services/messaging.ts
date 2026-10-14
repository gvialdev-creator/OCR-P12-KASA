import { ApiError } from "@/api/errors";
import type { ConversationPage } from "@/features/messages/types";

/**
 * Effectue un appel REST de messagerie authentifié côté serveur.
 * Les réponses ne sont jamais mises en cache ; le token reste dans l’en-tête
 * Authorization et le délai réseau est limité à 15 secondes.
 */
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

/**
 * Détecte une conversation existante avec le destinataire.
 * Si l’endpoint dédié n’est pas disponible (404), parcourt les pages de la liste
 * des conversations ; les autres erreurs restent propagées à l’appelant.
 */
export async function hasConversationWithUser(recipientId: number, token: string): Promise<boolean> {
  try {
    const result = await messagingRequest<{ exists: boolean }>(
      `/conversations/with/${recipientId}`,
      token,
    );
    if (!result || typeof result.exists !== "boolean") {
      throw new ApiError("Réponse invalide de la messagerie.");
    }
    return result.exists;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
  }

  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({ limit: "30" });
    if (cursor) query.set("before", cursor);
    const page = await messagingRequest<ConversationPage>(
      `/conversations?${query}`,
      token,
    );
    if (page.conversations.some((conversation) => conversation.peer.id === recipientId)) {
      return true;
    }
    cursor = page.next_cursor;
  } while (cursor);

  return false;
}