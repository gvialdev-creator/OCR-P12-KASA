import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "./register-form";

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }));
vi.mock("@/features/auth/actions/register", () => ({ registerAction: registerMock }));

describe("RegisterForm", () => {
  beforeEach(() => registerMock.mockReset());

  it("renders required personal details, a new password and a login link", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("textbox", { name: "Nom" })).toHaveAttribute("autocomplete", "family-name");
    expect(screen.getByRole("textbox", { name: "Prénom" })).toHaveAttribute("autocomplete", "given-name");
    expect(screen.getByRole("textbox", { name: "Adresse email" })).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("minlength", "8");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("pattern");
    expect(screen.getByText(/8 caractères minimum.*majuscule.*minuscule.*chiffre.*symbole/)).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("announces an API error and keeps non-secret fields", async () => {
    registerMock.mockResolvedValue({ error: "Un compte avec ces informations existe déjà." });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByRole("textbox", { name: "Nom" }), "Dupont");
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), "Marie");
    await user.type(screen.getByRole("textbox", { name: "Adresse email" }), "marie@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "GoodPass1!");
    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Un compte avec ces informations existe déjà.");
    expect(screen.getByRole("textbox", { name: "Nom" })).toHaveValue("Dupont");
    expect(screen.getByRole("textbox", { name: "Adresse email" })).toHaveValue("marie@example.com");
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
  });
});