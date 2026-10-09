import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/api/errors";
import { startConversationAction, sendMessageAction, markReadAction, loadMessagesAction, socketTicketAction } from "./messaging";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), request: vi.fn(), redirect: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: mocks.user }));
vi.mock("@/features/messages/services/messaging", () => ({ messagingRequest: mocks.request }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: "private-session" });
  mocks.user.mockResolvedValue({ id: 1, name: "Marie Dupont", role: "client", picture: null });
  mocks.redirect.mockImplementation(() => { throw new Error("REDIRECT"); });
  mocks.request.mockResolvedValue({ id: 9 });
});

it("redirects an unauthenticated sender using a safe property return path", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(startConversationAction(2, "/properties/flat")).rejects.toThrow("REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/login?returnTo=%2Fproperties%2Fflat");
  expect(mocks.request).not.toHaveBeenCalled();
});

it("rejects external login destinations", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(startConversationAction(2, "https://evil.example")).rejects.toThrow("REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/login?returnTo=%2Fmessages");
});

it("starts by host user id and rejects self-chat", async () => {
  expect(await startConversationAction(1, "/")).toHaveProperty("error");
  expect(mocks.request).not.toHaveBeenCalled();
  await expect(startConversationAction(2, "/properties/flat")).rejects.toThrow("REDIRECT");
  expect(mocks.request).toHaveBeenCalledWith("/conversations", "private-session", "POST", { recipient_id: 2 });
  expect(mocks.redirect).toHaveBeenCalledWith("/messages/9");
});

it("sends bounded content with caller UUID and no caller identity", async () => {
  const uuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  await sendMessageAction(9, "Bonjour", uuid);
  expect(mocks.request).toHaveBeenCalledWith("/conversations/9/messages", "private-session", "POST", { body: "Bonjour", client_message_id: uuid });
  mocks.request.mockClear();
  expect((await sendMessageAction(9, "x".repeat(4001), uuid)).error).not.toBeNull();
  expect(mocks.request).not.toHaveBeenCalled();
});

it("does not bypass private conversation errors for admin", async () => {
  mocks.user.mockResolvedValue({ id: 3, role: "admin" });
  mocks.request.mockRejectedValue(new ApiError("Cette conversation est privée.", 403));
  expect((await loadMessagesAction(9)).error).toBe("Cette conversation est privée.");
});

it("validates cursor combinations and forwards read cursor without identity", async () => {
  expect((await loadMessagesAction(9, { before: 1, after: 2 })).error).not.toBeNull();
  await markReadAction(9, 4);
  expect(mocks.request).toHaveBeenCalledWith("/conversations/9/read", "private-session", "PATCH", { last_read_message_id: 4 });
});

it("obtains only a dedicated socket ticket", async () => {
  await socketTicketAction();
  expect(mocks.request).toHaveBeenCalledWith("/messaging/socket-token", "private-session", "POST", undefined);
});

it("redirects expired backend sessions back to the discussion", async () => {
  mocks.request.mockRejectedValue(new ApiError("Expired", 401));
  await expect(markReadAction(9, 4)).rejects.toThrow("REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/login?returnTo=%2Fmessages%2F9");
});