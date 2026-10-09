import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/api/errors";
import ConversationPage from "./page";

const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn(), notFound: vi.fn(), login: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/features/messages/services/session", () => ({ messagingSession: mocks.session, messagingLogin: mocks.login }));
vi.mock("@/features/messages/services/messaging", () => ({ messagingRequest: mocks.request }));
vi.mock("@/features/messages/components/conversation-view", () => ({ ConversationView: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ token: "private", user: { id: 3, role: "admin" } });
  mocks.notFound.mockImplementation(() => { throw new Error("NOT_FOUND"); });
  mocks.login.mockImplementation(() => { throw new Error("LOGIN"); });
});

it("does not expose another user's conversation even to an admin", async () => {
  mocks.request.mockRejectedValue(new ApiError("Private", 403));
  await expect(ConversationPage({ params: Promise.resolve({ id: "9" }) })).rejects.toThrow("NOT_FOUND");
});

it("rejects invalid route IDs without querying the API", async () => {
  await expect(ConversationPage({ params: Promise.resolve({ id: "oops" }) })).rejects.toThrow("NOT_FOUND");
  expect(mocks.request).not.toHaveBeenCalled();
});

it("retains the discussion return path on session expiration", async () => {
  mocks.request.mockRejectedValue(new ApiError("Expired", 401));
  await expect(ConversationPage({ params: Promise.resolve({ id: "9" }) })).rejects.toThrow("LOGIN");
  expect(mocks.login).toHaveBeenCalledWith("/messages/9");
});