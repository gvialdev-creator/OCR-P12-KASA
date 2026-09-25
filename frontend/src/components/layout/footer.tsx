import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-neutral-light-grey bg-neutral-white">
      <div className="container-app flex min-h-20 flex-col items-center justify-between gap-4 py-4 sm:flex-row">
        <Logo compact />
        <p className="text-center text-xs text-neutral-dark-grey">
          © {new Date().getFullYear()} Kasa. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}