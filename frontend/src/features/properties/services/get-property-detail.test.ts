import { describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/api/client";

import { getPropertyDetail } from "./get-property-detail";

vi.mock("@/api/client", () => ({ apiFetch: vi.fn() }));

describe("getPropertyDetail", () => {
  it("fetches the latest property and host profile without a fixed cache duration", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ host: { picture: "/uploads/current.jpg" } });

    await getPropertyDetail("property-1");

    expect(apiFetch).toHaveBeenCalledWith("/api/properties/property-1");
  });
});