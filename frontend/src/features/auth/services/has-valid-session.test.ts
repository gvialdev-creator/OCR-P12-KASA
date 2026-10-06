import { afterEach, describe, expect, it, vi } from "vitest";

import { getSessionUser, hasValidSession } from "./has-valid-session";

const token = `header.${Buffer.from(JSON.stringify({ id: 42 })).toString("base64url")}.signature`;

describe("hasValidSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects missing and malformed cookies without contacting the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");

    expect(await hasValidSession(undefined)).toBe(false);
    expect(await hasValidSession("not-a-jwt")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the backend to validate the session before redirecting", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42, role: "owner", name: "Hôte Kasa", email: "host@example.com", picture: "/uploads/host.jpg" }) });
    vi.stubGlobal("fetch", fetchMock);

    expect(await hasValidSession(token)).toBe(true);
    expect(await getSessionUser(token)).toEqual({ id: 42, role: "owner", name: "Hôte Kasa", email: "host@example.com", picture: "/uploads/host.jpg" });
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/api/users/42"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  });

  it("accepts a user without a profile picture", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42, role: "owner", name: "Hôte Kasa", email: null, picture: null }) }));

    expect(await getSessionUser(token)).toEqual({ id: 42, role: "owner", name: "Hôte Kasa", email: null, picture: null });
  });

  it("accepts sessions from a backend response that predates the email field", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42, role: "owner", name: "Hôte Kasa", picture: null }) }));

    expect(await getSessionUser(token)).toEqual({ id: 42, role: "owner", name: "Hôte Kasa", email: null, picture: null });
  });

  it("uses the email from the session token when an older API response omits it", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const tokenWithEmail = `header.${Buffer.from(JSON.stringify({ id: 42, email: "host@example.com" })).toString("base64url")}.signature`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42, role: "owner", name: "Hôte Kasa", picture: null }) }));

    expect(await getSessionUser(tokenWithEmail)).toEqual({ id: 42, role: "owner", name: "Hôte Kasa", email: "host@example.com", picture: null });
  });

  it("rejects a mismatched user response", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 7, role: "admin" }) }));
    expect(await getSessionUser(token)).toBeNull();
  });

  it("does not redirect when the backend rejects the token or is unavailable", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await hasValidSession(token)).toBe(false);
    expect(await hasValidSession(token)).toBe(false);
  });
});