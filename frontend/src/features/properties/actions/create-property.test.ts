import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import { createPropertyAction } from "./create-property";

const { userMock, uploadMock, createMock, deleteMock, redirectMock, revalidateMock } = vi.hoisted(() => ({
  userMock: vi.fn(), uploadMock: vi.fn(), createMock: vi.fn(), deleteMock: vi.fn(), redirectMock: vi.fn(), revalidateMock: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "token" }) }) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: userMock }));
vi.mock("@/features/properties/services/create-property", () => ({
  uploadPropertyImage: uploadMock, createProperty: createMock, deleteUploadedImages: deleteMock,
}));

function validForm() {
  const form = new FormData();
  form.set("title", "Studio"); form.set("location", "Nice"); form.set("postal_code", "06000"); form.set("price_per_night", "90");
  form.set("cover", new File(["image"], "cover.jpg", { type: "image/jpeg" }));
  form.set("host_id", "999");
  return form;
}

describe("createPropertyAction", () => {
  beforeEach(() => { vi.clearAllMocks(); userMock.mockResolvedValue({ id: 3, role: "owner" }); uploadMock.mockResolvedValue("/uploads/cover.jpg"); createMock.mockResolvedValue("new-id"); });

  it("refuses clients before uploading", async () => {
    userMock.mockResolvedValue({ id: 3, role: "client" });
    expect((await createPropertyAction({ error: null }, validForm())).error).toMatch(/autorisé/);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("uses the verified owner and preserves leading zero in postal code", async () => {
    await createPropertyAction({ error: null }, validForm());
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ host_id: 3, postal_code: "06000", cover: "/uploads/cover.jpg", price_per_night: 90 }), "token");
    expect(revalidateMock).toHaveBeenCalledWith("/");
    expect(redirectMock).toHaveBeenCalledWith("/properties/new-id");
  });

  it("rejects invalid fields before uploading", async () => {
    const form = validForm(); form.set("postal_code", "6000");
    expect((await createPropertyAction({ error: null }, form)).error).toMatch(/code postal/);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("cleans uploaded images if creation fails", async () => {
    createMock.mockRejectedValue(new ApiError("invalid property", 400));
    expect((await createPropertyAction({ error: null }, validForm())).error).toMatch(/pas pu/);
    expect(deleteMock).toHaveBeenCalledWith(["/uploads/cover.jpg"], "token");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("keeps uploads when the creation result is uncertain", async () => {
    createMock.mockRejectedValue(new Error("connection lost"));
    expect((await createPropertyAction({ error: null }, validForm())).error).toMatch(/existe déjà/);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("cleans earlier files when a later image upload fails", async () => {
    const form = validForm();
    form.append("pictures", new File(["photo"], "room.jpg", { type: "image/jpeg" }));
    uploadMock.mockResolvedValueOnce("/uploads/cover.jpg").mockRejectedValueOnce(new Error("upload failed"));

    expect((await createPropertyAction({ error: null }, form)).error).toMatch(/pas pu/);
    expect(deleteMock).toHaveBeenCalledWith(["/uploads/cover.jpg"], "token");
    expect(createMock).not.toHaveBeenCalled();
  });
});