import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "./page";

const { getCookie, hasValidSessionMock, redirectMock } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  hasValidSessionMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ hasValidSession: hasValidSessionMock }));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects guests to login", async () => {
    hasValidSessionMock.mockResolvedValue(false);
    redirectMock.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

    await expect(AccountPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("renders an account page for authenticated visitors", async () => {
    getCookie.mockReturnValue({ value: "token" });
    hasValidSessionMock.mockResolvedValue(true);
    render(await AccountPage());

    expect(hasValidSessionMock).toHaveBeenCalledWith("token");
    expect(screen.getByRole("heading", { name: "Mon compte" })).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});