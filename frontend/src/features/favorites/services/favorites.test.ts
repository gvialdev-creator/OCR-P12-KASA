import { afterEach, describe, expect, it, vi } from "vitest";

import { getUserFavorites, setPropertyFavorite } from "./favorites";

describe("favorites service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads a user's favorites without caching", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const response = [{ id: "flat-1", title: "Studio" }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getUserFavorites(42, "token")).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/api/users/42/favorites"), {
      headers: { Authorization: "Bearer token" },
      cache: "no-store",
    });
  });

  it.each([
    [true, "POST"],
    [false, "DELETE"],
  ] as const)("uses %s favorite state with %s", async (favorite, method) => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await setPropertyFavorite("flat 1", favorite, "token");

    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/api/properties/flat%201/favorite"), {
      method,
      headers: { Authorization: "Bearer token" },
      cache: "no-store",
    });
  });
});