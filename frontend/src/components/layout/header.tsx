import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import {
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
    <header className="flex justify-center md:mt-10">
      <div className="bg-neutral-white max-w-175 rounded-lg shadow-menu container-app flex h-16 items-center justify-between md:gap-7">
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

        <details className="relative md:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center text-neutral-dark-grey marker:content-none">
            <span className="sr-only">Ouvrir le menu</span>
            <MenuBurgerIcon className="size-11" />
          </summary>
          <nav
            className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-1 rounded-md border border-neutral-light-grey bg-neutral-white p-2 shadow-dropdown"
            aria-label="Navigation mobile"
          >
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2 text-sm font-medium hover:bg-brand-light-orange hover:text-brand-main-red"
              >
                {item.label}
              </Link>
            ))}                   
            <Link
              href="/messages"
              className="rounded-sm px-3 py-2 text-sm font-medium hover:bg-brand-light-orange hover:text-brand-main-red"
            >
              Messagerie
            </Link>
             <Link
              href="/favorites"
              className="rounded-sm px-3 py-2 text-sm font-medium hover:bg-brand-light-orange hover:text-brand-main-red"
            >
              Favoris
            </Link>
            <Link
              href="/properties/new"
              className="flex items-center justify-center gap-1 rounded-sm px-3 py-2 text-sm font-medium text-neutral-white bg-brand-main-red hover:bg-brand-dark-orange"
            >              
              Ajouter un logement
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}