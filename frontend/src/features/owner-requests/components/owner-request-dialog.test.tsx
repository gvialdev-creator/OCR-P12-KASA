import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnerRequestDialog } from "./owner-request-dialog";

const { getRequestMock, submitMock } = vi.hoisted(() => ({ getRequestMock: vi.fn(), submitMock: vi.fn() }));
vi.mock("@/features/owner-requests/actions/owner-requests", () => ({
  getMyOwnerRequestAction: getRequestMock,
  submitOwnerRequestAction: submitMock,
}));

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); } });
  vi.clearAllMocks();
});

describe("OwnerRequestDialog", () => {
  it("does not render the dialog portal before it is opened", () => {
    render(<OwnerRequestDialog />);

    expect(document.body.querySelector("dialog")).not.toBeInTheDocument();
  });

  it("confirms submission inside the same modal", async () => {
    getRequestMock.mockResolvedValue({ request: null, error: null });
    submitMock.mockResolvedValue({ request: { id: 8, status: "pending" }, error: null });
    const user = userEvent.setup();
    render(<OwnerRequestDialog />);

    await user.click(screen.getByRole("button", { name: "Ajouter un logement" }));
    const dialog = await screen.findByRole("dialog", { name: "Demander le statut propriétaire" });
    await user.click(await screen.findByRole("button", { name: "Envoyer ma demande" }));

    expect(await screen.findByText(/votre demande a bien été envoyée/i)).toBeInTheDocument();
    expect(dialog).toHaveAttribute("open");
    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  it("does not offer submission when a request is already pending", async () => {
    getRequestMock.mockResolvedValue({ request: { id: 8, status: "pending" }, error: null });
    const user = userEvent.setup();
    render(<OwnerRequestDialog />);

    await user.click(screen.getByRole("button", { name: "Ajouter un logement" }));

    expect(await screen.findByText(/une demande est déjà en attente/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Envoyer ma demande" })).not.toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });
});