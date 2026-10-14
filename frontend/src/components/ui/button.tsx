import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/** Options communes aux boutons natifs et liens présentés comme boutons. */
export interface SharedButtonProps {
  icon?: ReactNode;
  iconOnly?: boolean;
}

/** Props du bouton d’action, en plus des attributs HTML standards. */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, SharedButtonProps {}

/** Props d’un lien de navigation stylé comme un bouton. */
export interface ButtonLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>, SharedButtonProps {
  href: string;
}

function getButtonClassName(
  className: string,
  icon: ReactNode,
  iconOnly: boolean,
) {
  const dimensions = iconOnly
    ? "size-8 shrink-0 p-0"
    : icon
      ? "h-9 px-3"
      : "h-9 px-4";

  return `inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer rounded-lg bg-brand-main-red text-sm font-medium text-neutral-white transition-colors hover:bg-brand-dark-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-main-red disabled:cursor-not-allowed disabled:bg-neutral-light-grey disabled:text-neutral-dark-grey ${dimensions} ${className}`;
}

function ButtonContent({
  children,
  icon,
  iconOnly,
}: Required<Pick<SharedButtonProps, "iconOnly">> &
  Pick<SharedButtonProps, "icon"> & { children: ReactNode }) {
  return (
    <>
      {icon}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </>
  );
}

export function Button({
  children,
  className = "",
  disabled,
  icon,
  iconOnly = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={getButtonClassName(className, icon, iconOnly)}
      {...props}
    >
      <ButtonContent icon={icon} iconOnly={iconOnly}>
        {children}
      </ButtonContent>
    </button>
  );
}

export function ButtonLink({
  children,
  className = "",
  href,
  icon,
  iconOnly = false,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={getButtonClassName(className, icon, iconOnly)}
      {...props}
    >
      <ButtonContent icon={icon} iconOnly={iconOnly}>
        {children}
      </ButtonContent>
    </Link>
  );
}