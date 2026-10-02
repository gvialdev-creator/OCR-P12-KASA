import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreatePropertyForm } from "./create-property-form";

const { createActionMock } = vi.hoisted(() => ({ createActionMock: vi.fn() }));
vi.mock("@/features/properties/actions/create-property", () => ({ createPropertyAction: createActionMock }));

describe("CreatePropertyForm", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("shows required fields and optional categories", () => {
    render(<CreatePropertyForm />);
    expect(screen.getByLabelText(/titre de la propriété/i)).toBeRequired();
    expect(screen.getByLabelText(/code postal/i)).toHaveAttribute("pattern", "[0-9]{5}");
    expect(screen.getByLabelText(/image de couverture/i)).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText(/images du logement/i)).toHaveAttribute("multiple");
    expect(screen.getByRole("checkbox", { name: "WiFi" })).toBeInTheDocument();
  });

  it("previews and removes a selected gallery image", async () => {
    const objectUrl = vi.fn().mockReturnValue("blob:preview");
    const revokeUrl = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: objectUrl, revokeObjectURL: revokeUrl }));
    const user = userEvent.setup();
    render(<CreatePropertyForm />);
    const input = screen.getByLabelText(/images du logement/i) as HTMLInputElement;
    await user.upload(input, new File(["photo"], "room.jpg", { type: "image/jpeg" }));
    expect(screen.getByRole("button", { name: "Retirer la photo 1" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer la photo 1" }));
    expect(screen.queryByRole("button", { name: "Retirer la photo 1" })).not.toBeInTheDocument();
    expect(revokeUrl).toHaveBeenCalledWith("blob:preview");
  });

  it("keeps entered details and images after a server error", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue("blob:preview"), revokeObjectURL: vi.fn() }));
    createActionMock.mockResolvedValue({ error: "Service indisponible" });
    const user = userEvent.setup();
    render(<CreatePropertyForm />);

    await user.type(screen.getByLabelText(/titre de la propriété/i), "Studio");
    await user.type(screen.getByLabelText(/code postal/i), "06000");
    await user.type(screen.getByLabelText(/localisation/i), "Nice");
    await user.type(screen.getByLabelText(/prix par nuit/i), "90");
    await user.click(screen.getByRole("checkbox", { name: "WiFi" }));
    await user.upload(screen.getByLabelText(/image de couverture/i), new File(["photo"], "cover.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Service indisponible");
    expect(screen.getByLabelText(/titre de la propriété/i)).toHaveValue("Studio");
    expect(screen.getByLabelText(/code postal/i)).toHaveValue("06000");
    expect(screen.getByRole("checkbox", { name: "WiFi" })).toBeChecked();
    expect(screen.getByAltText("Aperçu de la couverture")).toBeInTheDocument();
  });

  it("adds and removes a custom category", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyForm />);
    await user.type(screen.getByLabelText(/ajouter une catégorie personnalisée/i), "Terrasse");
    await user.click(screen.getByRole("button", { name: "Ajouter la catégorie" }));
    expect(screen.getByRole("button", { name: "Retirer la catégorie Terrasse" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer la catégorie Terrasse" }));
    expect(screen.queryByRole("button", { name: "Retirer la catégorie Terrasse" })).not.toBeInTheDocument();
  });
});