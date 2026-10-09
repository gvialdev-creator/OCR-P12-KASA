import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { StartMessageButton } from "./start-message-button";

const mocks = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock("@/features/messages/actions/messaging", () => ({ startConversationAction: mocks.start }));
beforeEach(() => vi.clearAllMocks());

it("starts with the host id and property return path, displaying controlled errors", async () => {
  mocks.start.mockResolvedValue({ error: "Impossible de démarrer" });
  render(<StartMessageButton recipientId={42} returnTo="/properties/flat" />);
  fireEvent.click(screen.getByRole("button", { name: "Envoyer un message" }));
  await screen.findByRole("alert");
  expect(mocks.start).toHaveBeenCalledWith(42, "/properties/flat");
  expect(screen.getByRole("button", { name: "Envoyer un message" })).toBeEnabled();
});

it("disables duplicate starts while pending", async () => {
  let complete!: (value: { error: string }) => void;
  mocks.start.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
  render(<StartMessageButton recipientId={42} returnTo="/" />);
  fireEvent.click(screen.getByRole("button", { name: "Envoyer un message" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Ouverture..." })).toBeDisabled());
  complete({ error: "Unavailable" });
  await screen.findByRole("alert");
});