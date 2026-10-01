import { afterEach, describe, expect, it, vi } from "vitest";

import { loginWithApi } from "./login";

describe("loginWithApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the credentials to the backend without caching and returns the token", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "signed-token", user: { id: 1 } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(loginWithApi("client@example.com", "secret")).resolves.toBe("signed-token");
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "client@example.com", password: "secret" }),
      cache: "no-store",
    });
  });

  it.each([400, 401])("reports invalid credentials for status %i", async (status) => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));

    await expect(loginWithApi("client@example.com", "wrong")).rejects.toThrow("Adresse email ou mot de passe incorrect.");
  });

  it("reports a server error without exposing the backend response", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(loginWithApi("client@example.com", "secret")).rejects.toThrow("Le service de connexion est indisponible.");
  });

  it("reports a network error", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    await expect(loginWithApi("client@example.com", "secret")).rejects.toThrow("Impossible de joindre le service de connexion.");
  });

  it("rejects a response without a token", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    await expect(loginWithApi("client@example.com", "secret")).rejects.toThrow("Réponse invalide du service de connexion.");
  });
});