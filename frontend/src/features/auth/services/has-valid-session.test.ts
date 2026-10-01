import { afterEach, describe, expect, it, vi } from "vitest";

import { hasValidSession } from "./has-valid-session";

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
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    expect(await hasValidSession(token)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/api/users/42"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  });

  it("does not redirect when the backend rejects the token or is unavailable", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await hasValidSession(token)).toBe(false);
    expect(await hasValidSession(token)).toBe(false);
  });
});