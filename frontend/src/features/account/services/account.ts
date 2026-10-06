import { ApiError } from "@/api/errors";

function apiUrl(path: string): URL {
  if (!process.env.API_BASE_URL) throw new ApiError("Le service du compte est indisponible.");
  return new URL(path, process.env.API_BASE_URL);
}

async function send(path: string, token: string, options: RequestInit): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de joindre le service du compte.");
  }
  if (!response.ok) {
    if (response.status === 409) throw new ApiError("Cette adresse email est déjà utilisée.", 409);
    if (response.status === 400) throw new ApiError("Les informations saisies ne sont pas valides.", 400);
    throw new ApiError("La modification n’a pas pu être enregistrée.", response.status);
  }
}

export function updateAccountProfile(
  userId: number,
  profile: { name: string; email: string; picture?: string },
  token: string,
): Promise<void> {
  return send(`/api/users/${userId}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

export async function uploadProfilePicture(file: File, token: string): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  body.set("purpose", "user-picture");

  let response: Response;
  try {
    response = await fetch(apiUrl("/api/uploads/image"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible d’envoyer la photo de profil.");
  }
  if (!response.ok) throw new ApiError("Impossible d’envoyer la photo de profil.", response.status);

  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("url" in result) || typeof result.url !== "string" || !result.url.startsWith("/uploads/")) {
    throw new ApiError("Réponse invalide de l’upload.");
  }
  return result.url;
}

export function changeAccountPassword(userId: number, password: string, token: string): Promise<void> {
  return send(`/api/users/${userId}/password`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}