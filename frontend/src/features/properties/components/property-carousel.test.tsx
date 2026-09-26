import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertyCarousel } from "./property-carousel";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, preload, ...props }: any) => (
    <img
      src={typeof src === "string" ? src : src?.src ?? ""}
      alt={alt}
      {...props}
    />
  ),
}));

describe("PropertyCarousel", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders empty state when there are no images", () => {
    render(<PropertyCarousel images={[]} title="Appartement cosy" />);

    expect(
      screen.getByText(/aucune photo disponible pour appartement cosy/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /photo précédente/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /photo suivante/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a single image without navigation controls", () => {
    render(
      <PropertyCarousel images={["/images/flat-1.jpg"]} title="Appartement cosy" />,
    );

    expect(
      screen.getByRole("img", {
        name: /photo 1 sur 1 de appartement cosy/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /photo précédente/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /photo suivante/i }),
    ).not.toBeInTheDocument();
  });

  it("renders thumbnails on the side when there are between 2 and 4 images", () => {
    render(
      <PropertyCarousel
        images={[
          "/images/flat-1.jpg",
          "/images/flat-2.jpg",
          "/images/flat-3.jpg",
          "/images/flat-4.jpg",
        ]}
        title="Appartement cosy"
      />,
    );

    const gallery = screen.getByRole("region", { name: /galerie photos de appartement cosy/i });
    const wrapper = gallery.firstElementChild as HTMLElement;
    const thumbnails = screen.getAllByRole("button", {
      name: /afficher la photo/i,
    });

    expect(wrapper).toHaveClass("md:flex");
    expect(wrapper).toHaveClass("md:gap-2");
    expect(thumbnails).toHaveLength(4);
    thumbnails.forEach((thumbnail) => {
      expect(wrapper.contains(thumbnail)).toBe(true);
    });
  });

  it("renders a gallery layout when there are more than 4 images", () => {
    render(
      <PropertyCarousel
        images={[
          "/images/flat-1.jpg",
          "/images/flat-2.jpg",
          "/images/flat-3.jpg",
          "/images/flat-4.jpg",
          "/images/flat-5.jpg",
        ]}
        title="Appartement cosy"
      />,
    );

    const gallery = screen.getByRole("region", { name: /galerie photos de appartement cosy/i });
    const wrapper = gallery.firstElementChild as HTMLElement;
    const thumbnails = screen.getAllByRole("button", {
      name: /afficher la photo/i,
    });

    expect(wrapper).not.toHaveClass("md:flex");
    expect(wrapper).not.toHaveClass("md:gap-2");
    expect(thumbnails).toHaveLength(5);
    expect(screen.getByRole("button", { name: /afficher la photo 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /afficher la photo 5/i })).toBeInTheDocument();
  });

  it("navigates between images with previous and next buttons", async () => {
    const user = userEvent.setup();

    render(
      <PropertyCarousel
        images={["/images/flat-1.jpg", "/images/flat-2.jpg", "/images/flat-3.jpg"]}
        title="Appartement cosy"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: /photo 1 sur 3 de appartement cosy/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /photo suivante/i }));

    expect(
      screen.getByRole("img", {
        name: /photo 2 sur 3 de appartement cosy/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /photo précédente/i }));

    expect(
      screen.getByRole("img", {
        name: /photo 1 sur 3 de appartement cosy/i,
      }),
    ).toBeInTheDocument();
  });

  it("displays the selected image when clicking a thumbnail", async () => {
    const user = userEvent.setup();

    render(
      <PropertyCarousel
        images={["/images/flat-1.jpg", "/images/flat-2.jpg", "/images/flat-3.jpg"]}
        title="Appartement cosy"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /afficher la photo 3/i }),
    );

    expect(
      screen.getByRole("img", {
        name: /photo 3 sur 3 de appartement cosy/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /afficher la photo 3/i }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("pauses and resumes the slideshow", async () => {
    const user = userEvent.setup();

    render(
      <PropertyCarousel
        images={["/images/flat-1.jpg", "/images/flat-2.jpg", "/images/flat-3.jpg"]}
        title="Appartement cosy"
      />,
    );

    expect(
      screen.getByRole("button", { name: /mettre le diaporama en pause/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /mettre le diaporama en pause/i }),
    );

    expect(
      screen.getByRole("button", { name: /reprendre le diaporama/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /reprendre le diaporama/i }),
    );

    expect(
      screen.getByRole("button", { name: /mettre le diaporama en pause/i }),
    ).toBeInTheDocument();
  });
});
