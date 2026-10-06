import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "./page";

const { getCookie, getSessionUserMock, redirectMock } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  getSessionUserMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: getSessionUserMock }));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects guests to login", async () => {
    getSessionUserMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

    await expect(AccountPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("renders an account page for authenticated visitors", async () => {
    getCookie.mockReturnValue({ value: "token" });
    getSessionUserMock.mockResolvedValue({ id: 42, role: "owner", name: "Alice Martin", email: "alice@example.com", picture: null });
    render(await AccountPage());

    expect(getSessionUserMock).toHaveBeenCalledWith("token");
    expect(screen.getByRole("heading", { name: "Mon compte" })).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom")).toHaveValue("Alice");
    expect(screen.getByLabelText("Nom")).toHaveValue("Martin");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});