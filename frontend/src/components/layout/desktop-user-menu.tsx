"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { UserIcon } from "@/components/ui/icons";

export function DesktopUserMenu({ children }: { children: ReactNode }) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        menuRef.current.open = false;
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <details ref={menuRef} className="group relative">
      <summary className="flex size-8 cursor-pointer list-none items-center justify-center text-brand-main-red hover:text-brand-dark-orange focus-visible:outline-2 focus-visible:outline-brand-main-red" aria-label="Menu utilisateur" title="Menu utilisateur">
        <UserIcon className="size-4" />
      </summary>
      <div
        className="absolute right-0 z-30 mt-2 min-w-40 rounded-md border border-neutral-light-grey bg-neutral-white p-2 shadow-dropdown"
        onClick={(event) => {
          if ((event.target as Element).closest("a[href], button[type=submit]") && menuRef.current) {
            menuRef.current.open = false;
          }
        }}
      >
        {children}
      </div>
    </details>
  );
}