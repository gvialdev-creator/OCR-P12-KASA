import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "./header";

const { getCookie, getSessionUserMock } = vi.hoisted(() => ({
  getCookie: vi.fn(),
  getSessionUserMock: vi.fn(),
}));

let currentPathname = "/about";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));
vi.mock("next/navigation", () => ({ usePathname: () => currentPathname }));
vi.mock("@/features/auth/services/has-valid-session", () => ({ getSessionUser: getSessionUserMock }));
vi.mock("@/features/auth/actions/logout", () => ({ logoutAction: vi.fn() }));

describe("Header user menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers login but no account or logout to a guest", async () => {
    getSessionUserMock.mockResolvedValue(null);
    render(await Header());

    const actions = screen.getByRole("navigation", { name: "Actions du compte" });
    expect(within(actions).getByLabelText("Menu utilisateur")).toBeInTheDocument();
    expect(within(actions).getByRole("link", { name: "Connexion" })).toHaveAttribute("href", "/login");
    expect(within(actions).queryByRole("link", { name: "Mon compte" })).not.toBeInTheDocument();
    expect(within(actions).queryByRole("button", { name: "Déconnexion" })).not.toBeInTheDocument();
    const mobile = screen.getByRole("navigation", { name: "Navigation mobile" });
    expect(within(mobile).getByRole("link", { name: "Connexion" })).toBeInTheDocument();
    for (const navigation of [actions, mobile]) {
      expect(within(navigation).queryByRole("link", { name: "Ajouter un logement" })).not.toBeInTheDocument();
      expect(within(navigation).queryByRole("link", { name: "Favoris" })).not.toBeInTheDocument();
      expect(within(navigation).queryByRole("link", { name: /messages|messagerie/i })).not.toBeInTheDocument();
    }
  });

  it("offers account and logout but no login to a signed-in user", async () => {
    getCookie.mockReturnValue({ value: "token" });
    getSessionUserMock.mockResolvedValue({ id: 42, role: "owner" });
    render(await Header());

    expect(getSessionUserMock).toHaveBeenCalledWith("token");
    const actions = screen.getByRole("navigation", { name: "Actions du compte" });
    expect(within(actions).getByRole("link", { name: "Mon compte" })).toHaveAttribute("href", "/account");
    expect(within(actions).getByRole("button", { name: "Déconnexion" })).toBeInTheDocument();
    expect(within(actions).queryByRole("link", { name: "Connexion" })).not.toBeInTheDocument();
    const mobile = screen.getByRole("navigation", { name: "Navigation mobile" });
    expect(within(mobile).getByRole("link", { name: "Mon compte" })).toHaveAttribute("href", "/account");
    expect(within(mobile).getByRole("button", { name: "Déconnexion" })).toBeInTheDocument();
    for (const navigation of [actions, mobile]) {
      expect(within(navigation).getByRole("link", { name: "Ajouter un logement" })).toHaveAttribute("href", "/properties/new");
      expect(within(navigation).getByRole("link", { name: "Favoris" })).toHaveAttribute("href", "/favorites");
      expect(within(navigation).getByRole("link", { name: /messages|messagerie/i })).toHaveAttribute("href", "/messages");
    }
  });

  it("does not offer publication to a signed-in client", async () => {
    getCookie.mockReturnValue({ value: "token" });
    getSessionUserMock.mockResolvedValue({ id: 42, role: "client" });
    render(await Header());
    expect(screen.getAllByRole("link", { name: "Favoris" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Ajouter un logement" })).not.toBeInTheDocument();
  });

  it("closes the mobile menu after navigation, including links in Compte", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const user = userEvent.setup();
    currentPathname = "/about";
    const { rerender } = render(await Header());

    const mobile = screen.getByRole("navigation", { name: "Navigation mobile" });
    mobile.addEventListener("click", (event) => event.preventDefault());
    const menu = mobile.closest("details") as HTMLDetailsElement;
    const accountMenu = within(mobile).getByText("Compte").closest("details") as HTMLDetailsElement;
    expect(accountMenu).toHaveAttribute("open");

    await user.click(menu.querySelector("summary") as HTMLElement);
    expect(menu.open).toBe(true);
    await user.click(within(mobile).getByRole("link", { name: "Accueil" }));
    expect(menu.open).toBe(true);

    currentPathname = "/";
    rerender(await Header());
    expect(menu.open).toBe(false);

    await user.click(menu.querySelector("summary") as HTMLElement);
    await user.click(within(mobile).getByRole("link", { name: "Connexion" }));
    expect(menu.open).toBe(true);

    currentPathname = "/login";
    rerender(await Header());
    expect(menu.open).toBe(false);
  });

  it("closes the mobile menu for a link to the current page", async () => {
    getSessionUserMock.mockResolvedValue(null);
    currentPathname = "/about";
    const user = userEvent.setup();
    render(await Header());

    const mobile = screen.getByRole("navigation", { name: "Navigation mobile" });
    mobile.addEventListener("click", (event) => event.preventDefault());
    const menu = mobile.closest("details") as HTMLDetailsElement;
    await user.click(menu.querySelector("summary") as HTMLElement);
    expect(menu.open).toBe(true);

    await user.click(within(mobile).getByRole("link", { name: "À propos" }));
    expect(menu.open).toBe(false);
  });

  it("closes the desktop user menu on an outside click or a menu link", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const user = userEvent.setup();
    render(await Header());

    const actions = screen.getByRole("navigation", { name: "Actions du compte" });
    actions.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a[href]")) event.preventDefault();
    });
    const trigger = within(actions).getByLabelText("Menu utilisateur");
    const menu = trigger.closest("details") as HTMLDetailsElement;

    await user.click(trigger);
    expect(menu.open).toBe(true);
    await user.click(document.body);
    expect(menu.open).toBe(false);

    await user.click(trigger);
    await user.click(within(actions).getByRole("link", { name: "Connexion" }));
    expect(menu.open).toBe(false);
  });

  it("keeps the desktop menu open on internal clicks and closes it on account actions", async () => {
    getCookie.mockReturnValue({ value: "token" });
    getSessionUserMock.mockResolvedValue({ id: 42, role: "owner" });
    const user = userEvent.setup();
    render(await Header());

    const actions = screen.getByRole("navigation", { name: "Actions du compte" });
    actions.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a[href], button[type=submit]")) event.preventDefault();
    });
    const trigger = within(actions).getByLabelText("Menu utilisateur");
    const menu = trigger.closest("details") as HTMLDetailsElement;

    await user.click(trigger);
    await user.click(menu.querySelector("div") as HTMLElement);
    expect(menu.open).toBe(true);

    await user.click(within(actions).getByRole("link", { name: "Mon compte" }));
    expect(menu.open).toBe(false);

    await user.click(trigger);
    await user.click(within(actions).getByRole("button", { name: "Déconnexion" }));
    expect(menu.open).toBe(false);
  });
});