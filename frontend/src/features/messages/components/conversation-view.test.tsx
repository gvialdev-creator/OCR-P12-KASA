import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ConversationView } from "./conversation-view";
import type { Conversation, Message, MessagingEvent } from "@/features/messages/types";

const mocks = vi.hoisted(() => ({ get: vi.fn(), load: vi.fn(), send: vi.fn(), read: vi.fn(), notify: vi.fn(), listeners: new Set<(event: MessagingEvent) => void>() }));
vi.mock("@/features/messages/actions/messaging", () => ({ getConversationAction: mocks.get, loadMessagesAction: mocks.load, sendMessageAction: mocks.send, markReadAction: mocks.read }));
vi.mock("./messages-shell", () => ({ useMessaging: () => ({ user: { id: 1, name: "Marie Dupont", picture: null }, online: false, listeners: mocks.listeners, notify: mocks.notify }) }));

const conversation: Conversation = { id: 9, peer: { id: 2, name: "Jean Martin", picture: null }, last_message: null, last_message_at: "2026-10-08T10:00:00Z", unread_count: 0, read_states: [] };
const message = (id: number, sender_id = 2): Message => ({ id, sender_id, conversation_id: 9, body: `Texte ${id}`, client_message_id: String(id), created_at: "2026-10-08T10:00:00Z" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listeners.clear();
  mocks.load.mockResolvedValue({ data: { messages: [], has_more: false }, error: null });
  mocks.get.mockResolvedValue({ data: conversation, error: null });
  mocks.read.mockResolvedValue({ data: { user_id: 1, last_read_message_id: 2 }, error: null });
});

it("restores missed read receipts from REST on reconnect", async () => {
  mocks.get.mockResolvedValue({ data: { ...conversation, read_states: [{ user_id: 2, last_read_message_id: 3 }] }, error: null });
  render(<ConversationView conversation={conversation} initialPage={{ messages: [message(3, 1)], has_more: false }} />);
  await screen.findByText("Lu");
});

it("advances only visible incoming messages and stops in a hidden document", async () => {
  const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 0, bottom: 500, left: 0, right: 600, height: 500, width: 600, x: 0, y: 0, toJSON: () => ({}) });
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  try {
    const view = render(<ConversationView conversation={conversation} initialPage={{ messages: [message(2)], has_more: false }} />);
    await waitFor(() => expect(mocks.read).toHaveBeenCalledWith(9, 2));
    view.unmount();
    mocks.read.mockClear();
    visibility.mockReturnValue("hidden");
    await act(async () => {
      render(<ConversationView conversation={conversation} initialPage={{ messages: [message(2)], has_more: false }} />);
    });
    await act(async () => {
      fireEvent.scroll(screen.getByLabelText("Historique des messages"));
    });
    expect(mocks.read).not.toHaveBeenCalled();
  } finally { bounds.mockRestore(); visibility.mockRestore(); }
});

it("keeps the draft and same UUID after an unconfirmed send, clearing only on success", async () => {
  mocks.send.mockResolvedValueOnce({ data: null, error: "Envoi non confirmé" }).mockResolvedValueOnce({ data: message(3, 1), error: null });
  render(<ConversationView conversation={conversation} initialPage={{ messages: [], has_more: false }} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Bonjour" } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("textbox")).toHaveValue("Bonjour");
  await waitFor(() => expect(screen.getByRole("button", { name: "Réessayer" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  expect(mocks.send.mock.calls[0]).toEqual(mocks.send.mock.calls[1]);
  expect(screen.getByText("Envoyé")).toBeInTheDocument();
});

it("catches up every reconnect page, deduplicates and shows read receipts", async () => {
  mocks.load.mockResolvedValueOnce({ data: { messages: [message(2, 1)], has_more: true }, error: null })
    .mockResolvedValueOnce({ data: { messages: [message(2, 1), message(3)], has_more: false }, error: null });
  render(<ConversationView conversation={conversation} initialPage={{ messages: [message(1)], has_more: false }} />);
  await screen.findByText("Texte 3");
  expect(screen.getAllByText("Texte 2")).toHaveLength(1);
  expect(mocks.load).toHaveBeenCalledWith(9, { after: 2 });
  act(() => mocks.listeners.forEach((listener) => listener({ type: "read", conversation_id: 9, read_state: { user_id: 2, last_read_message_id: 2, last_read_at: "now" } })));
  expect(screen.getByText("Lu")).toBeInTheDocument();
});

it("never marks merely delivered or hidden messages read", async () => {
  render(<ConversationView conversation={conversation} initialPage={{ messages: [message(1)], has_more: false }} />);
  await waitFor(() => expect(mocks.load).toHaveBeenCalled());
  expect(mocks.read).not.toHaveBeenCalled();
});

it("does not skip a missing incoming message when a newer own send succeeds", async () => {
  mocks.send.mockResolvedValue({ data: message(3, 1), error: null });
  render(<ConversationView conversation={conversation} initialPage={{ messages: [message(1)], has_more: false }} />);
  await waitFor(() => expect(mocks.load).toHaveBeenCalledWith(9, { after: 1 }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Bonjour" } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
  await screen.findByText("Texte 3");
  mocks.load.mockResolvedValue({ data: { messages: [message(2), message(3, 1)], has_more: false }, error: null });
  act(() => mocks.listeners.forEach((listener) => listener({ type: "connected" })));
  await screen.findByText("Texte 2");
  expect(mocks.load).toHaveBeenLastCalledWith(9, { after: 1 });
  expect(screen.getAllByText("Texte 3")).toHaveLength(1);
});