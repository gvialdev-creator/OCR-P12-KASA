import { afterEach, expect, it, vi } from "vitest";
import { hasConversationWithUser, messagingRequest } from "./messaging";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("uses the server bearer, no-store and exact REST payload", async () => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3000");
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
  vi.stubGlobal("fetch", fetcher);
  expect(await messagingRequest("/conversations", "server-session", "POST", { recipient_id: 2 })).toEqual({ id: 1 });
  expect(fetcher).toHaveBeenCalledWith(new URL("http://localhost:3000/api/conversations"), expect.objectContaining({
    cache: "no-store", method: "POST", headers: { Authorization: "Bearer server-session", "Content-Type": "application/json" }, body: '{"recipient_id":2}',
  }));
});

it("does not expose backend private errors", async () => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3000");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
  await expect(messagingRequest("/conversations/1", "session")).rejects.toMatchObject({ status: 403, message: "Cette conversation est privée." });
});

it("checks whether the current user already has a conversation with the host", async () => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3000");
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ exists: true }) });
  vi.stubGlobal("fetch", fetcher);
  expect(await hasConversationWithUser(42, "server-session")).toBe(true);
  expect(fetcher).toHaveBeenCalledWith(new URL("http://localhost:3000/api/conversations/with/42"), expect.objectContaining({
    method: "GET", cache: "no-store", headers: { Authorization: "Bearer server-session", "Content-Type": "application/json" },
  }));
});

it("falls back to the paginated conversation list when the targeted route is unavailable", async () => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3000");
  const fetcher = vi.fn()
    .mockResolvedValueOnce({ ok: false, status: 404 })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversations: [{ peer: { id: 42 } }],
        next_cursor: null,
      }),
    });
  vi.stubGlobal("fetch", fetcher);

  expect(await hasConversationWithUser(42, "server-session")).toBe(true);
  expect(fetcher).toHaveBeenNthCalledWith(
    2,
    new URL("http://localhost:3000/api/conversations?limit=30"),
    expect.any(Object),
  );
});

it("identifies a missing creation route instead of a missing conversation", async () => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3001");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers({ "content-type": "text/html" }) }));
  await expect(messagingRequest("/conversations", "session", "POST", { recipient_id: 2 })).rejects.toMatchObject({
    status: 404,
    message: "La route de messagerie est indisponible. Redémarrez le backend pour charger les nouvelles routes.",
  });
});

it("identifies an unavailable recipient during creation", async () => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3001");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers({ "content-type": "application/json" }) }));
  await expect(messagingRequest("/conversations", "session", "POST", { recipient_id: 2 })).rejects.toMatchObject({
    status: 404,
    message: "Le destinataire de cette conversation n'est pas disponible.",
  });
});