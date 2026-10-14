import { describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/api/client";

import { getPropertyDetail } from "./get-property-detail";

vi.mock("@/api/client", () => ({ apiFetch: vi.fn() }));

describe("getPropertyDetail", () => {
  it("caches property details for one hour", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ host: { picture: "/uploads/current.jpg" } });

    await getPropertyDetail("studio-nice");

    expect(apiFetch).toHaveBeenCalledWith("/api/properties/slug/studio-nice", {
      revalidate: 3600,
    });
  });
});