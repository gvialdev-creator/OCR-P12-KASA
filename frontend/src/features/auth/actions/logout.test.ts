import { describe, expect, it, vi } from "vitest";

import { logoutAction } from "./logout";

const { deleteCookie, revalidate, redirectMock } = vi.hoisted(() => ({
  deleteCookie: vi.fn(),
  revalidate: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ delete: deleteCookie }) }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

describe("logoutAction", () => {
  it("deletes the session and redirects to login", async () => {
    await logoutAction();

    expect(deleteCookie).toHaveBeenCalledWith("kasa_session");
    expect(revalidate).toHaveBeenCalledWith("/", "layout");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});