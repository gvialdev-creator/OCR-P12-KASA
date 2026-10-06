"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { HeartIcon } from "@/components/ui/icons";
import { setFavoriteAction } from "@/features/favorites/actions/set-favorite";

interface FavoriteButtonProps {
  propertyId: string;
  propertyTitle: string;
  initialFavorite: boolean;
  isAuthenticated: boolean;
}

export function FavoriteButton({ propertyId, propertyTitle, initialFavorite, isAuthenticated }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggleFavorite() {
    setError(null);

    if (!isAuthenticated) {
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    startTransition(async () => {
      const result = await setFavoriteAction(propertyId, !favorite);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFavorite(result.favorite);
      router.refresh();
    });
  }

  return (
    <div className="absolute right-3 top-3 z-10">
      <button
        type="button"
        aria-label={favorite ? `Retirer ${propertyTitle} des favoris` : `Ajouter ${propertyTitle} aux favoris`}
        aria-pressed={favorite}
        aria-busy={isPending}
        disabled={isPending}
        onClick={toggleFavorite}
        className={`flex size-8 items-center justify-center cursor-pointer rounded-sm shadow-card transition-colors hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-main-red disabled:cursor-wait ${favorite ? "bg-brand-main-red text-neutral-white" : "bg-neutral-white text-brand-main-red"}`}
      >
        <HeartIcon filled={favorite} className="size-4" />
      </button>
      {error && <span role="alert" className="absolute right-0 top-10 w-48 rounded-sm bg-neutral-white px-2 py-1 text-xs text-brand-main-red shadow-card">{error}</span>}
    </div>
  );
}