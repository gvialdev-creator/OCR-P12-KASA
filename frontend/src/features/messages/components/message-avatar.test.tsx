import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageAvatar, messageInitials, validAvatarSource } from "./message-avatar";

describe("message avatars", () => {
  it.each([["Marie Dupont", "DM"], ["  Marie   Dupont Durand ", "DM"], ["Élodie Noël", "NÉ"], ["Marie", "M"], ["", "?"]])("%s uses family then given name", (name, expected) => {
    expect(messageInitials(name)).toBe(expected);
  });
  it("rejects unsafe or invalid sources", () => {
    expect(validAvatarSource("javascript:alert(1)")).toBeNull();
    expect(validAvatarSource("/uploads/../secret")).toBeNull();
    expect(validAvatarSource("/uploads/profile.jpg")).toBe("/uploads/profile.jpg");
  });
  it("falls back on error and retries a changed image", () => {
    const user = { id: 1, name: "Marie Dupont", picture: "https://example.com/one.jpg" };
    const { container, rerender } = render(<MessageAvatar user={user} />);
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByText("DM")).toBeInTheDocument();
    rerender(<MessageAvatar user={{ ...user, picture: "https://example.com/two.jpg" }} />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });
});