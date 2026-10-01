import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import { loginWithApi } from "@/features/auth/services/login";

import { loginAction } from "./login";

const { setCookie, redirectMock } = vi.hoisted(() => ({
  setCookie: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/features/auth/services/login", () => ({ loginWithApi: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: setCookie }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const loginMock = vi.mocked(loginWithApi);

function credentials(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input without contacting the backend", async () => {
    const result = await loginAction({ error: null }, credentials("invalid", ""));

    expect(result.error).toMatch(/adresse email valide/i);
    expect(loginMock).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("returns a controlled error for invalid credentials", async () => {
    loginMock.mockRejectedValue(new ApiError("Adresse email ou mot de passe incorrect.", 401));

    const result = await loginAction({ error: null }, credentials("client@example.com", "wrong"));

    expect(result.error).toBe("Adresse email ou mot de passe incorrect.");
    expect(setCookie).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("stores the token in an HttpOnly cookie and redirects after successful login", async () => {
    loginMock.mockResolvedValue("signed-token");

    await loginAction({ error: null }, credentials(" client@example.com ", "secret"));

    expect(loginMock).toHaveBeenCalledWith("client@example.com", "secret");
    expect(setCookie).toHaveBeenCalledWith("kasa_session", "signed-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});