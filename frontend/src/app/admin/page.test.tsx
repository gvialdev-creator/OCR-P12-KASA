import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "./page";

const { userMock, redirectMock, notFoundMock, requestsMock } = vi.hoisted(() => ({
  userMock: vi.fn(), redirectMock: vi.fn(), notFoundMock: vi.fn(), requestsMock: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "token" }) }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: notFoundMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: userMock }));
vi.mock("@/features/owner-requests/services/owner-requests", () => ({ listPendingOwnerRequests: requestsMock }));

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => { throw new Error("redirect"); });
    notFoundMock.mockImplementation(() => { throw new Error("notFound"); });
  });

  it("redirects guests to login", async () => {
    userMock.mockResolvedValue(null);
    await expect(AdminDashboardPage()).rejects.toThrow("redirect");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("rejects non-admin users", async () => {
    userMock.mockResolvedValue({ id: 7, role: "client", name: "Client", picture: null });
    await expect(AdminDashboardPage()).rejects.toThrow("notFound");
  });

  it("renders the pending owner request count and review link", async () => {
    userMock.mockResolvedValue({ id: 2, role: "admin", name: "Admin", picture: null });
    requestsMock.mockResolvedValue([
      { id: 1, status: "pending", submitted_at: "2026-10-06", decided_at: null, user_id: 3, name: "Client", email: null },
      { id: 2, status: "pending", submitted_at: "2026-10-06", decided_at: null, user_id: 4, name: "Client 2", email: null },
    ]);
    render(await AdminDashboardPage());
    expect(screen.getByRole("heading", { name: "Tableau de bord admin" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demandes propriétaires" })).toBeInTheDocument();
    expect(screen.getByText("2 demandes en cours")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Demandes propriétaires/ })).toHaveAttribute("href", "/admin/owner-requests");
  });

  it("keeps the review link available when the count cannot be loaded", async () => {
    userMock.mockResolvedValue({ id: 2, role: "admin", name: "Admin", picture: null });
    requestsMock.mockRejectedValue(new Error("service unavailable"));
    render(await AdminDashboardPage());
    expect(screen.getByText("Nombre de demandes en cours indisponible.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Demandes propriétaires/ })).toHaveAttribute("href", "/admin/owner-requests");
  });
});