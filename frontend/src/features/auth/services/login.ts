import { ApiError } from "@/api/errors";

interface LoginResponse {
  token: string;
}

export async function loginWithApi(email: string, password: string): Promise<string> {
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) {
    throw new ApiError("Le service de connexion est indisponible.");
  }

  let response: Response;
  try {
    response = await fetch(new URL("/auth/login", apiBaseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Impossible de joindre le service de connexion.");
  }

  if (response.status === 401 || response.status === 400) {
    throw new ApiError("Adresse email ou mot de passe incorrect.", response.status);
  }
  if (!response.ok) {
    throw new ApiError("Le service de connexion est indisponible.", response.status);
  }

  let data: LoginResponse;
  try {
    data = (await response.json()) as LoginResponse;
  } catch {
    throw new ApiError("Réponse invalide du service de connexion.");
  }
  if (typeof data?.token !== "string" || !data.token) {
    throw new ApiError("Réponse invalide du service de connexion.");
  }

  return data.token;
}