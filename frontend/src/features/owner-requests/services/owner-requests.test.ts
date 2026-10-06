import { afterEach, describe, expect, it, vi } from "vitest";

import { decideOwnerRequest, getMyOwnerRequest, listPendingOwnerRequests, submitOwnerRequest } from "./owner-requests";

describe("owner request API service", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("submits a request with Bearer authorization and no client-supplied identity", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 2, status: "pending" }) });
    vi.stubGlobal("fetch", fetchMock);

    await submitOwnerRequest("session-token");

    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/api/owner-requests"), {
      method: "POST",
      headers: { Authorization: "Bearer session-token" },
      cache: "no-store",
    });
  });

  it("loads the admin queue and sends an explicit decision", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, status: "approved" }) });
    vi.stubGlobal("fetch", fetchMock);

    expect(await listPendingOwnerRequests("session-token")).toEqual([]);
    await decideOwnerRequest(2, "approve", "session-token");

    expect(fetchMock.mock.calls[1]).toEqual([new URL("http://localhost:3001/api/admin/owner-requests/2"), {
      method: "PATCH",
      headers: { Authorization: "Bearer session-token", "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ decision: "approve" }),
    }]);
  });

  it("reads the latest request for the connected client", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const request = { id: 2, status: "pending", submitted_at: "2026-10-06T00:00:00Z", decided_at: null };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => request }));

    expect(await getMyOwnerRequest("session-token")).toEqual(request);
  });
});