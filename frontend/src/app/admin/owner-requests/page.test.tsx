import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminOwnerRequestsPage from "./page";

const { userMock, redirectMock, notFoundMock, requestsMock } = vi.hoisted(() => ({
  userMock: vi.fn(), redirectMock: vi.fn(), notFoundMock: vi.fn(), requestsMock: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "token" }) }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: notFoundMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: userMock }));
vi.mock("@/features/owner-requests/services/owner-requests", () => ({ listPendingOwnerRequests: requestsMock }));

describe("AdminOwnerRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => { throw new Error("redirect"); });
    notFoundMock.mockImplementation(() => { throw new Error("notFound"); });
  });

  it("redirects guests to login", async () => {
    userMock.mockResolvedValue(null);
    await expect(AdminOwnerRequestsPage()).rejects.toThrow("redirect");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("rejects non-admin users", async () => {
    userMock.mockResolvedValue({ id: 7, role: "client", name: "Client", picture: null });
    await expect(AdminOwnerRequestsPage()).rejects.toThrow("notFound");
    expect(requestsMock).not.toHaveBeenCalled();
  });

  it("renders the admin review queue", async () => {
    userMock.mockResolvedValue({ id: 2, role: "admin", name: "Admin", picture: null });
    requestsMock.mockResolvedValue([]);
    render(await AdminOwnerRequestsPage());
    expect(screen.getByRole("heading", { name: "Demandes propriétaire" })).toBeInTheDocument();
    expect(screen.getByText("Aucune demande en attente.")).toBeInTheDocument();
  });
});