import { ApiError } from "@/api/errors";

function apiUrl(path: string): URL {
  if (!process.env.API_BASE_URL) throw new ApiError("Le service des logements est indisponible.");
  return new URL(path, process.env.API_BASE_URL);
}

export async function uploadPropertyImage(file: File, purpose: string, token: string): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  body.set("purpose", purpose);
  let response: Response;
  try {
    response = await fetch(apiUrl("/api/uploads/image"), {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body, cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible d'envoyer les images.");
  }
  if (!response.ok) throw new ApiError("Impossible d'envoyer les images.", response.status);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("url" in result) || typeof result.url !== "string" || !result.url.startsWith("/uploads/")) {
    throw new ApiError("Réponse invalide de l'upload.");
  }
  return result.url;
}

export async function createProperty(payload: Record<string, unknown>, token: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(apiUrl("/api/properties"), {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload), cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de créer le logement.");
  }
  if (!response.ok) throw new ApiError("Impossible de créer le logement.", response.status);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
    throw new ApiError("Réponse invalide lors de la création.");
  }
  return result.id;
}

export async function updateUserProfile(userId: number, changes: { name?: string; picture?: string }, token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/users/${userId}`), {
      method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(changes), cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de mettre à jour le profil de l’hôte.");
  }
  if (!response.ok) throw new ApiError("Impossible de mettre à jour le profil de l’hôte.", response.status);
}

export async function deleteUploadedImages(urls: string[], token: string): Promise<void> {
  if (!urls.length) return;
  try {
    await fetch(apiUrl("/api/uploads/images"), {
      method: "DELETE", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ urls }), cache: "no-store",
    });
  } catch {
  }
}