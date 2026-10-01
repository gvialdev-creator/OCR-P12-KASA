import { afterEach, describe, expect, it, vi } from "vitest";

import { registerWithApi } from "./register";

describe("registerWithApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts only the expected fields and ignores the token returned by the backend", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "new-token", user: { id: 1 } }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(registerWithApi("Marie Dupont", "marie@example.com", "secret1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Marie Dupont", email: "marie@example.com", password: "secret1" }),
      cache: "no-store",
    });
  });

  it.each([
    [400, "Vérifiez les informations saisies."],
    [409, "Un compte avec ces informations existe déjà."],
    [500, "Le service d'inscription est indisponible."],
  ])("reports a controlled error for status %i", async (status, message) => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));

    await expect(registerWithApi("Marie Dupont", "marie@example.com", "secret1")).rejects.toThrow(message);
  });

  it("handles network failures", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    await expect(registerWithApi("Marie Dupont", "marie@example.com", "secret1")).rejects.toThrow("Impossible de joindre le service d'inscription.");
  });

  it("rejects a response with no token", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    await expect(registerWithApi("Marie Dupont", "marie@example.com", "secret1")).rejects.toThrow("Réponse invalide du service d'inscription.");
  });
});