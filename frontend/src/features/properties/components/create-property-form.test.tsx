import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreatePropertyForm } from "./create-property-form";

const { createActionMock } = vi.hoisted(() => ({ createActionMock: vi.fn() }));
vi.mock("@/features/properties/actions/create-property", () => ({ createPropertyAction: createActionMock }));

describe("CreatePropertyForm", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("shows required fields and optional categories", () => {
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture="/uploads/host.jpg" />);
    expect(screen.getByLabelText(/titre de la propriété/i)).toBeRequired();
    expect(screen.getByLabelText(/code postal/i)).toHaveAttribute("pattern", "[0-9]{5}");
    expect(screen.getByLabelText(/image de couverture/i)).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText("Image du logement 1")).not.toHaveAttribute("multiple");
    expect(screen.getByLabelText(/nom de l’hôte/i)).toBeDisabled();
    expect(screen.getByLabelText(/nom de l’hôte/i)).toHaveValue("Hôte Kasa");
    expect(screen.getByRole("img", { name: "Photo de profil de Hôte Kasa" })).toHaveAttribute("src", "/uploads/host.jpg");
    expect(within(screen.getByRole("region", { name: "Informations de l’hôte" })).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "WiFi" })).toBeInTheDocument();
  });

  it("shows the placeholder when the connected user has no profile picture", () => {
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);

    expect(screen.getByRole("img", { name: "Photo de profil de Hôte Kasa" })).toHaveAttribute("src", "/images/Portrait_Placeholder.png");
  });

  it("adds an individual gallery image field", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);

    expect(screen.getByLabelText("Image du logement 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ajouter une image" }));
    expect(screen.getByLabelText("Image du logement 2")).toBeInTheDocument();
  });

  it("previews and removes a selected gallery image", async () => {
    const objectUrl = vi.fn().mockReturnValue("blob:preview");
    const revokeUrl = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: objectUrl, revokeObjectURL: revokeUrl }));
    const user = userEvent.setup();
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);
    const input = screen.getByLabelText("Image du logement 1") as HTMLInputElement;
    await user.upload(input, new File(["photo"], "room.jpg", { type: "image/jpeg" }));
    expect(screen.getByRole("button", { name: "Retirer la photo 1" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer la photo 1" }));
    expect(screen.queryByRole("button", { name: "Retirer la photo 1" })).not.toBeInTheDocument();
    expect(revokeUrl).toHaveBeenCalledWith("blob:preview");
  });

  it("removes the selected cover image", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue("blob:cover"), revokeObjectURL: vi.fn() }));
    const user = userEvent.setup();
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);

    await user.upload(screen.getByLabelText(/image de couverture/i), new File(["cover"], "cover.jpg", { type: "image/jpeg" }));
    expect(screen.getByAltText("Aperçu de la couverture")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer l’image de couverture" }));

    expect(screen.queryByAltText("Aperçu de la couverture")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retirer l’image de couverture" })).not.toBeInTheDocument();
  });

  it("refreshes the preview URL when replacing the cover image", async () => {
    const createObjectUrl = vi.fn().mockReturnValueOnce("blob:first-cover").mockReturnValueOnce("blob:second-cover");
    const revokeObjectUrl = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: createObjectUrl, revokeObjectURL: revokeObjectUrl }));
    const user = userEvent.setup();
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);
    const coverInput = screen.getByLabelText(/image de couverture/i);

    await user.upload(coverInput, new File(["first"], "first.jpg", { type: "image/jpeg" }));
    expect(screen.getByAltText("Aperçu de la couverture")).toHaveAttribute("src", "blob:first-cover");
    await user.upload(coverInput, new File(["second"], "second.jpg", { type: "image/jpeg" }));

    expect(screen.getByAltText("Aperçu de la couverture")).toHaveAttribute("src", "blob:second-cover");
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:first-cover");
  });

  it("keeps entered details and images after a server error", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn().mockReturnValue("blob:preview"), revokeObjectURL: vi.fn() }));
    createActionMock.mockResolvedValue({ error: "Service indisponible" });
    const user = userEvent.setup();
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);

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
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);
    await user.type(screen.getByLabelText("Tag personnalisé 1"), "Terrasse");
    await user.click(screen.getByRole("button", { name: "Ajouter ce tag" }));
    expect(screen.getByRole("button", { name: "Retirer la catégorie Terrasse" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer la catégorie Terrasse" }));
    expect(screen.queryByRole("button", { name: "Retirer la catégorie Terrasse" })).not.toBeInTheDocument();
  });

  it("adds another custom tag field from the link below the input", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyForm hostName="Hôte Kasa" hostPicture={null} />);

    await user.click(screen.getByRole("button", { name: "+ Ajouter un tag" }));

    expect(screen.getByLabelText("Tag personnalisé 2")).toBeInTheDocument();
  });
});