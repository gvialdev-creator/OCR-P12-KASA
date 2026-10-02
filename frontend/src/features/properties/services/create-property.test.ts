import { afterEach, describe, expect, it, vi } from "vitest";

import { createProperty, uploadPropertyImage } from "./create-property";

describe("property creation API", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("uploads images with Bearer authorization and multipart form data", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "/uploads/cover.jpg" }) });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["image"], "cover.jpg", { type: "image/jpeg" });
    expect(await uploadPropertyImage(file, "property-cover", "token")).toBe("/uploads/cover.jpg");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.href).toBe("http://localhost:3001/api/uploads/image");
    expect(options.headers).toEqual({ Authorization: "Bearer token" });
    expect(options.body.get("file")).toBe(file);
    expect(options.body.get("purpose")).toBe("property-cover");
  });

  it("creates the property with its server-validated payload", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "new-id" }) });
    vi.stubGlobal("fetch", fetchMock);
    const payload = { title: "Studio", host_id: 3, postal_code: "06000" };
    expect(await createProperty(payload, "token")).toBe("new-id");
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/api/properties"), {
      method: "POST", headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
      body: JSON.stringify(payload), cache: "no-store",
    });
  });
});