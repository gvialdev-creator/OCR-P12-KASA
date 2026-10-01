import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("@/features/auth/actions/login", () => ({ loginAction: loginMock }));

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("renders accessible credential fields and the registration link", () => {
    render(<LoginForm />);

    expect(screen.getByRole("textbox", { name: "Adresse email" })).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inscrivez-vous" })).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByRole("link", { name: /mot de passe oublié/i })).not.toBeInTheDocument();
  });

  it("announces a login error without losing the email", async () => {
    loginMock.mockResolvedValue({ error: "Adresse email ou mot de passe incorrect." });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Adresse email" }), "client@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "wrong");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Adresse email ou mot de passe incorrect.");
    expect(screen.getByRole("textbox", { name: "Adresse email" })).toHaveValue("client@example.com");
  });
});