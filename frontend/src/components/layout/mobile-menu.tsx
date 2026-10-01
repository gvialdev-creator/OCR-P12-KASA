"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { CloseIcon, MenuBurgerIcon } from "@/components/ui/icons";

export function MobileMenu({ children }: { children: ReactNode }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  return (
    <details ref={menuRef} className="group md:hidden">
      <summary className="flex size-10 cursor-pointer list-none items-center justify-center text-neutral-dark-grey marker:content-none">
        <span className="sr-only group-open:hidden">Ouvrir le menu</span>
        <span className="sr-only hidden group-open:inline">Fermer le menu</span>
        <MenuBurgerIcon className="size-11 group-open:hidden" />
        <CloseIcon className="hidden size-11 group-open:block" />
      </summary>
      <nav
        className="absolute right-0 z-20 w-full h-[calc(100vh-4rem)] top-0 mt-16 pb-10 flex flex-col gap-1 bg-neutral-white"
        aria-label="Navigation mobile"
        onClick={(event) => {
          const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
          if (link && new URL(link.href).pathname === pathname && menuRef.current) {
            menuRef.current.open = false;
          }
        }}
      >
        {children}
      </nav>
    </details>
  );
}