import { beforeEach, describe, expect, it, vi } from "vitest";

import { setFavoriteAction } from "./set-favorite";

const { getCookie, getSessionUserMock, setPropertyFavoriteMock, revalidatePathMock } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  getSessionUserMock: vi.fn(),
  setPropertyFavoriteMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: getSessionUserMock }));
vi.mock("@/features/favorites/services/favorites", () => ({ setPropertyFavorite: setPropertyFavoriteMock }));

describe("setFavoriteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockReturnValue({ value: "session-token" });
    getSessionUserMock.mockResolvedValue({ id: 8, role: "client", name: "Alice", email: null, picture: null });
  });

  it("requires a valid session", async () => {
    getSessionUserMock.mockResolvedValue(null);

    await expect(setFavoriteAction("flat-1", true)).resolves.toEqual({
      favorite: false,
      error: "Votre session a expiré. Reconnectez-vous.",
    });
    expect(setPropertyFavoriteMock).not.toHaveBeenCalled();
  });

  it("changes the authenticated user's favorite and revalidates affected pages", async () => {
    await expect(setFavoriteAction("flat-1", true)).resolves.toEqual({ favorite: true, error: null });
    expect(setPropertyFavoriteMock).toHaveBeenCalledWith("flat-1", true, "session-token");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/favorites");
  });

  it("returns a controlled failure without changing the requested state", async () => {
    setPropertyFavoriteMock.mockRejectedValue(new Error("offline"));

    await expect(setFavoriteAction("flat-1", false)).resolves.toEqual({
      favorite: true,
      error: "Impossible de modifier ce favori.",
    });
  });
});