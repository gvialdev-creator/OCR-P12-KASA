import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FavoritesPage from "./page";

const { getCookie, getSessionUserMock, getFavoritesMock, redirectMock } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  getSessionUserMock: vi.fn(),
  getFavoritesMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock, useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: getSessionUserMock }));
vi.mock("@/features/favorites/services/favorites", () => ({ getUserFavorites: getFavoritesMock }));

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockReturnValue({ value: "token" });
    getSessionUserMock.mockResolvedValue({ id: 8, role: "client", name: "Alice", email: null, picture: null });
  });

  it("redirects guests to login and preserves the favorites destination", async () => {
    getSessionUserMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

    await expect(FavoritesPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login?returnTo=%2Ffavorites");
  });

  it("renders favorite cards", async () => {
    getFavoritesMock.mockResolvedValue([
      { id: "flat-1", title: "Appartement cosy", slug: "appartement-cosy", description: null, cover: null, location: "Paris", postal_code: null, price_per_night: 100, rating_avg: 0, ratings_count: 0 },
    ]);

    render(await FavoritesPage());

    expect(screen.getByRole("heading", { name: "Vos favoris" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Appartement cosy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retirer Appartement cosy des favoris" })).toBeInTheDocument();
  });

  it("shows a useful empty state", async () => {
    getFavoritesMock.mockResolvedValue([]);

    render(await FavoritesPage());

    expect(screen.getByRole("heading", { name: "Aucun favori pour le moment" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Découvrir les logements" })).toHaveAttribute("href", "/");
  });

  it("shows an error if favorites cannot be loaded", async () => {
    getFavoritesMock.mockRejectedValue(new Error("offline"));

    render(await FavoritesPage());

    expect(screen.getByRole("alert")).toHaveTextContent("Vos favoris ne peuvent pas être chargés");
  });
});