import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-neutral-light-grey bg-neutral-white">
      <div className="px-section flex min-h-20 flex-col items-center justify-between gap-4 py-4 sm:flex-row">
        <Logo compact />
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-5">
          <Link
            href="/conditions-utilisation"
            className="text-xs text-neutral-dark-grey underline-offset-2 hover:text-brand-main-red hover:underline focus-visible:outline-2 focus-visible:outline-brand-main-red"
          >
            Conditions d’utilisation
          </Link>
          <p className="text-center text-xs text-neutral-dark-grey">
            © {new Date().getFullYear()} Kasa. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}