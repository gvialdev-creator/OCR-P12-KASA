import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import { registerWithApi } from "@/features/auth/services/register";

import { registerAction } from "./register";

const { redirectMock, cookiesMock } = vi.hoisted(() => ({ redirectMock: vi.fn(), cookiesMock: vi.fn() }));
vi.mock("@/features/auth/services/register", () => ({ registerWithApi: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

const registerMock = vi.mocked(registerWithApi);

function details(familyName: string, givenName: string, email: string, password: string, acceptTerms = true) {
  const formData = new FormData();
  formData.set("familyName", familyName);
  formData.set("givenName", givenName);
  formData.set("email", email);
  formData.set("password", password);
  if (acceptTerms) formData.set("acceptTerms", "on");
  return formData;
}

describe("registerAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["", "Marie", "marie@example.com", "GoodPass1!"],
    ["Dupont", " ", "marie@example.com", "GoodPass1!"],
    ["Dupont", "Marie", "invalid", "GoodPass1!"],
    ["Dupont", "Marie", "marie@example.com", "short"],
    ["Dupont", "Marie", "marie@example.com", "lowercase1!"],
    ["Dupont", "Marie", "marie@example.com", "UPPERCASE1!"],
    ["Dupont", "Marie", "marie@example.com", "NoDigits!"],
    ["Dupont", "Marie", "marie@example.com", "NoSymbol1"],
  ])("rejects invalid input without calling the API", async (familyName, givenName, email, password) => {
    const result = await registerAction({ error: null }, details(familyName, givenName, email, password));
    expect(result.error).toBeTruthy();
    expect(registerMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("requires acceptance of the terms before calling the API", async () => {
    const result = await registerAction(
      { error: null },
      details("Dupont", "Marie", "marie@example.com", "GoodPass1!", false),
    );

    expect(result.error).toBe("Vous devez accepter les conditions d’utilisation pour créer un compte.");
    expect(registerMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns an API error without redirecting", async () => {
    registerMock.mockRejectedValue(new ApiError("Un compte avec ces informations existe déjà.", 409));
    const result = await registerAction({ error: null }, details("Dupont", "Marie", "marie@example.com", "GoodPass1!"));
    expect(result.error).toMatch(/existe déjà/);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to login without setting a session cookie on success", async () => {
    registerMock.mockResolvedValue(undefined);
    await registerAction({ error: null }, details(" Dupont ", " Marie ", " marie@example.com ", "GoodPass1!"));
    expect(registerMock).toHaveBeenCalledWith("Marie Dupont", "marie@example.com", "GoodPass1!");
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login?registered=1");
  });
});