import Link from "next/link";
import { cookies } from "next/headers";

import { ButtonLink } from "@/components/ui/button";
import { DesktopUserMenu } from "@/components/layout/desktop-user-menu";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { logoutAction } from "@/features/auth/actions/logout";
import { getSessionUser } from "@/features/auth/services/has-valid-session";
import {
  HeartIcon,
  MessageIcon,
  PlusIcon,
  UserIcon,
} from "@/components/ui/icons";

const mainNavigation = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/about" },
];

export async function Header() {
  const sessionUser = await getSessionUser((await cookies()).get("kasa_session")?.value);
  const isLoggedIn = sessionUser !== null;
  const canPublish = sessionUser?.role === "owner" || sessionUser?.role === "admin";

  return (
    <header className="flex flex-col items-center justify-center md:mt-10">
      <div className="text-neutral-black bg-neutral-white md:max-w-200 md:rounded-lg md:shadow-menu container-app flex h-16 items-center justify-between md:gap-7">
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Navigation principale"
        >
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-black transition-colors hover:text-brand-main-red focus-visible:text-brand-main-red"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="md:hidden">
          <Logo compact />
        </div>
        <div className="hidden md:block md:justify-self-center px-5.5">
          <Logo />
        </div>

        <nav
          className="hidden items-center justify-end gap-5 md:flex"
          aria-label="Actions du compte"
        >
          {isLoggedIn && (
            <>
              {canPublish && <Link
                href="/properties/new"
                className="flex items-center gap-1 text-sm text-brand-main-red transition-colors hover:text-brand-dark-orange"
              >
                <PlusIcon className="size-4" />
                Ajouter un logement
              </Link>}
              <Link
                href="/favorites"
                className="flex size-8 items-center justify-center text-xl leading-none text-brand-main-red transition-colors hover:text-brand-dark-orange"
                aria-label="Favoris"
                title="Favoris"
              >
                <HeartIcon className="size-4" />
              </Link>
              <Link
                href="/messages"
                className="group flex size-8 items-center justify-center text-brand-main-red transition-colors hover:text-brand-dark-orange"
                aria-label="Messages"
                title="Messages"
              >
                <MessageIcon className="size-4" />
              </Link>
            </>
          )}
          <DesktopUserMenu>
              {isLoggedIn ? (
                <>
                  <Link href="/account" className="block rounded-sm px-3 py-2 text-sm text-neutral-black hover:bg-brand-light-orange focus-visible:outline-2 focus-visible:outline-brand-main-red">Mon compte</Link>
                  <form action={logoutAction}>
                    <button type="submit" className="w-full cursor-pointer rounded-sm px-3 py-2 text-left text-sm text-neutral-black hover:bg-brand-light-orange focus-visible:outline-2 focus-visible:outline-brand-main-red">Déconnexion</button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="block rounded-sm px-3 py-2 text-sm text-neutral-black hover:bg-brand-light-orange focus-visible:outline-2 focus-visible:outline-brand-main-red">Connexion</Link>
              )}
          </DesktopUserMenu>
        </nav>

        <MobileMenu>
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-7 text-2xl border-b border-neutral-light-grey hover:bg-brand-light-orange hover:text-brand-main-red"
              >
                {item.label}
              </Link>
            ))}                   
            {isLoggedIn && (
              <>
                <Link
                  href="/messages"
                  className="rounded-sm px-3 py-7 text-2xl border-b border-neutral-light-grey hover:bg-brand-light-orange hover:text-brand-main-red"
                >
                  Messagerie
                </Link>
                <Link
                  href="/favorites"
                  className="rounded-sm px-3 py-7 text-2xl hover:bg-brand-light-orange hover:text-brand-main-red"
                >
                  Favoris
                </Link>
              </>
            )}
            <details open className="border-t border-neutral-light-grey">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-7 text-2xl text-neutral-black hover:bg-brand-light-orange hover:text-brand-main-red focus-visible:outline-2 focus-visible:outline-brand-main-red">
                <UserIcon className="size-6" /> Compte
              </summary>
              <div className="flex flex-col bg-brand-light-orange pl-6">
                {isLoggedIn ? (
                  <>
                    <Link href="/account" className="px-3 py-4 text-lg text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red">Mon compte</Link>
                    <form action={logoutAction}>
                      <button type="submit" className="w-full cursor-pointer px-3 py-4 text-left text-lg text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red">Déconnexion</button>
                    </form>
                  </>
                ) : (
                  <Link href="/login" className="px-3 py-4 text-lg text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red">Connexion</Link>
                )}
              </div>
            </details>
            {canPublish && (
              <ButtonLink
                href="/properties/new"
                className="mt-3 self-start"
              >
                Ajouter un logement
              </ButtonLink>
            )}
        </MobileMenu>
      </div>
    </header>
  );
}