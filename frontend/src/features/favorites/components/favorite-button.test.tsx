import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FavoriteButton } from "./favorite-button";

const { pushMock, refreshMock, setFavoriteMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  setFavoriteMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock, refresh: refreshMock }) }));
vi.mock("@/features/favorites/actions/set-favorite", () => ({ setFavoriteAction: setFavoriteMock }));

describe("FavoriteButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends visitors to login with their current internal route", () => {
    window.history.replaceState({}, "", "/?category=city");
    render(<FavoriteButton propertyId="flat-1" propertyTitle="Studio" initialFavorite={false} isAuthenticated={false} />);

    const button = screen.getByRole("button", { name: "Ajouter Studio aux favoris" });
    expect(button).toHaveClass("bg-neutral-white", "text-brand-main-red");
    expect(button.querySelectorAll("path")[0]).toHaveAttribute("fill", "#868686");
    expect(button.querySelectorAll("path")[1]).toHaveAttribute("fill", "white");
    expect(button.querySelectorAll("path")[1]).toHaveAttribute("stroke", "#F5F5F5");
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith("/login?returnTo=%2F%3Fcategory%3Dcity");
    expect(setFavoriteMock).not.toHaveBeenCalled();
  });

  it("toggles a favorite and refreshes server-rendered state", async () => {
    setFavoriteMock.mockResolvedValue({ favorite: true, error: null });
    render(<FavoriteButton propertyId="flat-1" propertyTitle="Studio" initialFavorite={false} isAuthenticated />);

    fireEvent.click(screen.getByRole("button", { name: "Ajouter Studio aux favoris" }));

    const button = await screen.findByRole("button", { name: "Retirer Studio des favoris" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("bg-brand-main-red", "text-neutral-white");
    expect(button.querySelectorAll("path")[0]).toHaveAttribute("fill", "#E0C2BB");
    expect(button.querySelectorAll("path")[1]).toHaveAttribute("fill", "white");
    expect(button.querySelectorAll("path")[1]).toHaveAttribute("stroke", "#F5F5F5");
    expect(setFavoriteMock).toHaveBeenCalledWith("flat-1", true);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("announces API errors and preserves the current favorite state", async () => {
    setFavoriteMock.mockResolvedValue({ favorite: false, error: "Service indisponible" });
    render(<FavoriteButton propertyId="flat-1" propertyTitle="Studio" initialFavorite isAuthenticated />);

    fireEvent.click(screen.getByRole("button", { name: "Retirer Studio des favoris" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Service indisponible");
    expect(screen.getByRole("button", { name: "Retirer Studio des favoris" })).toHaveAttribute("aria-pressed", "true");
  });
});