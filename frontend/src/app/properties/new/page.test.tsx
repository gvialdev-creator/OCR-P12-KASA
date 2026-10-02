import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NewPropertyPage from "./page";

const { userMock, redirectMock, notFoundMock } = vi.hoisted(() => ({ userMock: vi.fn(), redirectMock: vi.fn(), notFoundMock: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "token" }) }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: notFoundMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: userMock }));
vi.mock("@/features/properties/components/create-property-form", () => ({ CreatePropertyForm: () => <h1>Ajouter une propriété</h1> }));

describe("NewPropertyPage", () => {
  beforeEach(() => { vi.clearAllMocks(); redirectMock.mockImplementation(() => { throw new Error("redirect"); }); notFoundMock.mockImplementation(() => { throw new Error("notFound"); }); });
  it("redirects guests to login", async () => {
    userMock.mockResolvedValue(null);
    await expect(NewPropertyPage()).rejects.toThrow("redirect");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
  it("rejects clients", async () => {
    userMock.mockResolvedValue({ id: 1, role: "client" });
    await expect(NewPropertyPage()).rejects.toThrow("notFound");
  });
  it("renders for owners", async () => {
    userMock.mockResolvedValue({ id: 1, role: "owner" });
    render(await NewPropertyPage());
    expect(screen.getByRole("heading", { name: "Ajouter une propriété" })).toBeInTheDocument();
  });
});