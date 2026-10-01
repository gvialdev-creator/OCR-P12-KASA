import { ApiError } from "@/api/errors";

export async function registerWithApi(name: string, email: string, password: string): Promise<void> {
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) {
    throw new ApiError("Le service d'inscription est indisponible.");
  }

  let response: Response;
  try {
    response = await fetch(new URL("/auth/register", apiBaseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de joindre le service d'inscription.");
  }

  if (response.status === 409) {
    throw new ApiError("Un compte avec ces informations existe déjà.", 409);
  }
  if (response.status === 400) {
    throw new ApiError("Vérifiez les informations saisies.", 400);
  }
  if (!response.ok) {
    throw new ApiError("Le service d'inscription est indisponible.", response.status);
  }

  try {
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("token" in data) || typeof data.token !== "string" || !data.token) {
      throw new Error("Invalid response");
    }
  } catch {
    throw new ApiError("Réponse invalide du service d'inscription.");
  }
}