import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateAccountPasswordAction, updateAccountProfileAction } from "./update-account";

const { getCookie, getSessionUserMock, updateProfileMock, uploadPictureMock, changePasswordMock } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  getSessionUserMock: vi.fn(),
  updateProfileMock: vi.fn(),
  uploadPictureMock: vi.fn(),
  changePasswordMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: getSessionUserMock }));
vi.mock("@/features/account/services/account", () => ({
  updateAccountProfile: updateProfileMock,
  uploadProfilePicture: uploadPictureMock,
  changeAccountPassword: changePasswordMock,
}));

function profileForm({ picture }: { picture?: File } = {}) {
  const data = new FormData();
  data.set("familyName", "Martin");
  data.set("givenName", "Alice");
  data.set("email", "alice@example.com");
  if (picture) data.set("picture", picture);
  return data;
}

function passwordForm(password: string, confirmation: string) {
  const data = new FormData();
  data.set("newPassword", password);
  data.set("confirmPassword", confirmation);
  return data;
}

describe("account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockReturnValue({ value: "session-token" });
    getSessionUserMock.mockResolvedValue({ id: 12, role: "owner", name: "Alice Martin", email: "alice@example.com", picture: null });
  });

  it("updates a validated personal profile and uploads an owner picture", async () => {
    const picture = new File(["image"], "portrait.png", { type: "image/png" });
    uploadPictureMock.mockResolvedValue("/uploads/portrait.png");

    const result = await updateAccountProfileAction({ error: null, success: null }, profileForm({ picture }));

    expect(result.success).toMatch(/informations personnelles/i);
    expect(uploadPictureMock).toHaveBeenCalledWith(picture, "session-token");
    expect(updateProfileMock).toHaveBeenCalledWith(12, {
      name: "Alice Martin",
      email: "alice@example.com",
      picture: "/uploads/portrait.png",
    }, "session-token");
  });

  it("rejects a client attempting to upload a profile picture", async () => {
    getSessionUserMock.mockResolvedValue({ id: 12, role: "client", name: "Alice Martin", email: "alice@example.com", picture: null });
    const picture = new File(["image"], "portrait.png", { type: "image/png" });

    const result = await updateAccountProfileAction({ error: null, success: null }, profileForm({ picture }));

    expect(result.error).toMatch(/réservée aux propriétaires et aux administrateurs/i);
    expect(uploadPictureMock).not.toHaveBeenCalled();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("requires matching new password fields before changing the password", async () => {
    const mismatch = await updateAccountPasswordAction({ error: null, success: null }, passwordForm("NewPass1!", "OtherPass1!"));
    expect(mismatch.error).toMatch(/ne correspondent pas/i);
    expect(changePasswordMock).not.toHaveBeenCalled();

    const success = await updateAccountPasswordAction({ error: null, success: null }, passwordForm("NewPass1!", "NewPass1!"));
    expect(success.success).toMatch(/mot de passe a été modifié/i);
    expect(changePasswordMock).toHaveBeenCalledWith(12, "NewPass1!", "session-token");
  });
});