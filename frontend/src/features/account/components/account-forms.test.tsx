import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach } from "vitest";
import { describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/features/auth/services/has-valid-session";

import { AccountForms } from "./account-forms";

vi.mock("@/features/account/actions/update-account", () => ({
  updateAccountPasswordAction: vi.fn(),
  updateAccountProfileAction: vi.fn(),
}));

beforeEach(() => {
  vi.stubGlobal("URL", Object.assign(URL, {
    createObjectURL: vi.fn().mockReturnValue("blob:profile-preview"),
    revokeObjectURL: vi.fn(),
  }));
});

const clientUser: SessionUser = {
  id: 12,
  role: "client",
  name: "Alice Martin",
  email: "alice@example.com",
  picture: null,
};

describe("AccountForms", () => {
  it("renders personal and password forms without a photo control for clients", () => {
    render(<AccountForms user={clientUser} givenName="Alice" familyName="Martin" />);

    expect(screen.getByRole("heading", { name: "Informations personnelles" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
    expect(screen.getByLabelText("Prénom")).toHaveValue("Alice");
    expect(screen.getByLabelText("Adresse email")).toHaveValue("alice@example.com");
    expect(screen.getByLabelText("Rôle du compte")).toHaveTextContent("Client");
    expect(screen.queryByRole("textbox", { name: "Rôle du compte" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Modifier la photo")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nouveau mot de passe")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Confirmation du nouveau mot de passe")).toHaveAttribute("type", "password");
  });

  it.each([
    ["owner", "Propriétaire"],
    ["admin", "Administrateur"],
  ] as const)("shows the %s role and allows picture changes", (role, label) => {
    render(<AccountForms user={{ ...clientUser, role }} givenName="Alice" familyName="Martin" />);

    expect(screen.getByLabelText("Rôle du compte")).toHaveTextContent(label);
    expect(screen.getByRole("img", { name: "Photo de profil de Alice Martin" })).toHaveAttribute("src", "/images/Portrait_Placeholder.png");
    expect(screen.getByLabelText("Modifier la photo")).toHaveAttribute("type", "file");
  });

  it("previews the selected profile picture and releases its temporary URL", async () => {
    const user = userEvent.setup();
    const picture = new File(["image"], "portrait.png", { type: "image/png" });
    const { unmount } = render(<AccountForms user={{ ...clientUser, role: "owner" }} givenName="Alice" familyName="Martin" />);

    await user.upload(screen.getByLabelText("Modifier la photo"), picture);

    expect(await screen.findByRole("img", { name: "Photo de profil de Alice Martin" })).toHaveAttribute("src", "blob:profile-preview");
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:profile-preview");
  });
});