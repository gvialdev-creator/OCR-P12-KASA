import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminOwnerRequestList } from "./admin-owner-request-list";

const { decideMock } = vi.hoisted(() => ({ decideMock: vi.fn() }));
vi.mock("@/features/owner-requests/actions/owner-requests", () => ({ decideOwnerRequestAction: decideMock }));

const request = {
  id: 4,
  user_id: 12,
  name: "Camille Martin",
  email: "camille@example.com",
  status: "pending" as const,
  submitted_at: "2026-10-05T12:00:00.000Z",
  decided_at: null,
};

describe("AdminOwnerRequestList", () => {
  it("removes a request from the queue after approval", async () => {
    decideMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AdminOwnerRequestList initialRequests={[request]} />);

    await user.click(screen.getByRole("button", { name: "Accepter" }));

    expect(decideMock).toHaveBeenCalledWith(4, "approve");
    expect(await screen.findByText("Aucune demande en attente.")).toBeInTheDocument();
  });

  it("keeps the request visible and reports a failed refusal", async () => {
    decideMock.mockResolvedValue({ error: "API indisponible" });
    const user = userEvent.setup();
    render(<AdminOwnerRequestList initialRequests={[request]} />);

    await user.click(screen.getByRole("button", { name: "Refuser" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("API indisponible");
    expect(screen.getByText("Camille Martin")).toBeInTheDocument();
  });
});