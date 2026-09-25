import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  CloseIcon,
  HeartIcon,
  MenuBurgerIcon,
  MessageIcon,
  PlusIcon,
} from "@/components/ui/icons";

const mainNavigation = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/about" },
];

export function Header() {
  return (
    <header className="flex flex-col items-center justify-center md:mt-10">
      <div className="bg-neutral-white md:max-w-175 md:rounded-lg md:shadow-menu container-app flex h-16 items-center justify-between md:gap-7">
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
          <Link
            href="/properties/new"
            className="flex items-center gap-1 text-sm text-brand-main-red transition-colors hover:text-brand-dark-orange"
          >
            <PlusIcon className="size-4" />
            Ajouter un logement
          </Link>
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
        </nav>

        <details className="group md:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center text-neutral-dark-grey marker:content-none">
            <span className="sr-only group-open:hidden">Ouvrir le menu</span>
            <span className="sr-only hidden group-open:inline">Fermer le menu</span>
            <MenuBurgerIcon className="size-11 group-open:hidden" />
            <CloseIcon className="hidden size-11 group-open:block" />
          </summary>
          <nav
            className="absolute right-0 z-20 w-full h-[calc(100vh-4rem)] top-0 mt-16 pb-10 flex flex-col gap-1 bg-neutral-white"
            aria-label="Navigation mobile"
          >
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-7 text-2xl border-b border-neutral-light-grey hover:bg-brand-light-orange hover:text-brand-main-red"
              >
                {item.label}
              </Link>
            ))}                   
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
            <ButtonLink
              href="/properties/new"
              className="mt-3 self-start"
            >
              Ajouter un logement
            </ButtonLink>
          </nav>
        </details>
      </div>
    </header>
  );
}