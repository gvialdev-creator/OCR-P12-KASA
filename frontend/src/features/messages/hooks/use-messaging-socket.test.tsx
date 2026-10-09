import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useMessagingSocket } from "./use-messaging-socket";

const mocks = vi.hoisted(() => ({ ticket: vi.fn(), io: vi.fn() }));
vi.mock("@/features/messages/actions/messaging", () => ({ socketTicketAction: mocks.ticket }));
vi.mock("socket.io-client", () => ({ io: mocks.io }));

function fakeSocket() {
  const handlers = new Map<string, (event?: unknown) => void>();
  return { handlers, auth: { ticket: "ticket" }, connected: false,
    on: vi.fn((name, handler) => { handlers.set(name, handler); }),
    connect: vi.fn(), disconnect: vi.fn(), removeAllListeners: vi.fn(() => handlers.clear()),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_MESSAGING_SOCKET_URL", "http://localhost:3998");
  mocks.ticket.mockResolvedValue({ data: { token: "short-ticket", expires_at: "2026-10-08T15:00:00Z" }, error: null });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

it("pushes messages/read events, requests catchup and removes listeners on unmount", async () => {
  const socket = fakeSocket();
  mocks.io.mockReturnValue(socket);
  const receive = vi.fn();
  const { result, unmount } = renderHook(() => useMessagingSocket(receive));
  await waitFor(() => expect(socket.connect).toHaveBeenCalled());
  expect(mocks.io).toHaveBeenCalledWith("http://localhost:3998", expect.objectContaining({ auth: { ticket: "short-ticket" }, reconnection: false }));
  act(() => {
    socket.handlers.get("connect")!();
    socket.handlers.get("messaging:message-created")!({ version: 1, message: { id: 4 } });
    socket.handlers.get("messaging:read-updated")!({ version: 1, conversation_id: 9, read_state: { last_read_message_id: 4 } });
  });
  expect(result.current.online).toBe(true);
  expect(receive).toHaveBeenCalledWith({ type: "connected" });
  expect(receive).toHaveBeenCalledWith({ type: "message", message: { id: 4 } });
  expect(receive).toHaveBeenCalledWith(expect.objectContaining({ type: "read" }));
  unmount();
  expect(socket.disconnect).toHaveBeenCalled();
  expect(socket.removeAllListeners).toHaveBeenCalled();
  expect(socket.auth).toEqual({});
});

it("reissues the ticket after expiration disconnect instead of reusing it", async () => {
  const first = fakeSocket();
  const second = fakeSocket();
  mocks.io.mockReturnValueOnce(first).mockReturnValueOnce(second);
  const { unmount } = renderHook(() => useMessagingSocket(vi.fn()));
  await waitFor(() => expect(first.connect).toHaveBeenCalled());
  vi.useFakeTimers();
  await act(async () => { first.handlers.get("disconnect")!(); vi.advanceTimersByTime(1000); });
  expect(mocks.ticket).toHaveBeenCalledTimes(2);
  expect(second.connect).toHaveBeenCalled();
  unmount();
});