import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Property } from "@/domain/types/property";

import { PropertyGrid } from "./property-grid";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/features/favorites/actions/set-favorite", () => ({ setFavoriteAction: vi.fn() }));

const property: Property = {
  id: "flat-1",
  slug: "appartement-cosy",
  title: "Appartement cosy",
  description: null,
  cover: null,
  location: "Paris 17e",
  postal_code: null,
  price_per_night: 100,
  rating_avg: 0,
  ratings_count: 0,
};

describe("PropertyGrid", () => {
  it("renders the property link and independent active favorite button", () => {
    render(<PropertyGrid properties={[property]} favoriteIds={[property.id]} isAuthenticated />);

    expect(screen.getByRole("link", { name: /Appartement cosy/ })).toHaveAttribute("href", "/properties/flat-1");
    expect(screen.getByRole("button", { name: "Retirer Appartement cosy des favoris" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders an empty-grid message when no properties are provided", () => {
    render(<PropertyGrid properties={[]} />);

    expect(screen.getByText("Aucun logement disponible pour le moment.")).toBeInTheDocument();
  });
});