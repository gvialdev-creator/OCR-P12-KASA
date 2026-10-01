import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import { registerWithApi } from "@/features/auth/services/register";

import { registerAction } from "./register";

const { redirectMock, cookiesMock } = vi.hoisted(() => ({ redirectMock: vi.fn(), cookiesMock: vi.fn() }));
vi.mock("@/features/auth/services/register", () => ({ registerWithApi: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

const registerMock = vi.mocked(registerWithApi);

function details(familyName: string, givenName: string, email: string, password: string) {
  const formData = new FormData();
  formData.set("familyName", familyName);
  formData.set("givenName", givenName);
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("registerAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["", "Marie", "marie@example.com", "secret1"],
    ["Dupont", " ", "marie@example.com", "secret1"],
    ["Dupont", "Marie", "invalid", "secret1"],
    ["Dupont", "Marie", "marie@example.com", "short"],
  ])("rejects invalid input without calling the API", async (familyName, givenName, email, password) => {
    const result = await registerAction({ error: null }, details(familyName, givenName, email, password));
    expect(result.error).toBeTruthy();
    expect(registerMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns an API error without redirecting", async () => {
    registerMock.mockRejectedValue(new ApiError("Un compte avec ces informations existe déjà.", 409));
    const result = await registerAction({ error: null }, details("Dupont", "Marie", "marie@example.com", "secret1"));
    expect(result.error).toMatch(/existe déjà/);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to login without setting a session cookie on success", async () => {
    registerMock.mockResolvedValue(undefined);
    await registerAction({ error: null }, details(" Dupont ", " Marie ", " marie@example.com ", "secret1"));
    expect(registerMock).toHaveBeenCalledWith("Marie Dupont", "marie@example.com", "secret1");
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login?registered=1");
  });
});