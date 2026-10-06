import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

const { getCookie, redirectMock, hasValidSessionMock } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirectMock: vi.fn(),
  hasValidSessionMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ hasValidSession: hasValidSessionMock }));
vi.mock("@/features/auth/components/login-form", () => ({
  LoginForm: () => <form aria-label="Connexion" />,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasValidSessionMock.mockResolvedValue(false);
  });

  it("redirects an authenticated visitor to a safe return route", async () => {
    getCookie.mockReturnValue({ value: "signed-token" });
    hasValidSessionMock.mockResolvedValue(true);
    redirectMock.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

    await expect(LoginPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ returnTo: "/favorites" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(getCookie).toHaveBeenCalledWith("kasa_session");
    expect(hasValidSessionMock).toHaveBeenCalledWith("signed-token");
    expect(redirectMock).toHaveBeenCalledWith("/favorites");
  });

  it("shows the form when there is no valid session", async () => {
    getCookie.mockReturnValue({ value: "expired-token" });

    render(await LoginPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));
    expect(hasValidSessionMock).toHaveBeenCalledWith("expired-token");
    expect(screen.getByRole("form", { name: "Connexion" })).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("announces a completed registration", async () => {
    render(await LoginPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ registered: "1" }) }));
    expect(screen.getByRole("status")).toHaveTextContent("Inscription réussie. Vous pouvez vous connecter.");
  });

  it("does not show a success message for other query values", async () => {
    render(await LoginPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ registered: "0" }) }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders an internal return destination into the login form", async () => {
    render(await LoginPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ returnTo: "/properties/flat-1" }) }));
    expect(screen.getByRole("form", { name: "Connexion" })).toBeInTheDocument();
  });
});