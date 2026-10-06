import Image from "next/image";

import { Button } from "@/components/ui/button";
import { StarIcon } from "@/components/ui/icons";
import type { PropertyDetail } from "@/domain/types/property";

interface PropertyHostCardProps {
  property: PropertyDetail;
}

export function PropertyHostCard({ property }: PropertyHostCardProps) {
  const host = property.host;

  return (
    <aside className="rounded-lg bg-neutral-white p-page shadow-card" aria-labelledby="host-title">
      <h2 id="host-title" className="text-lg font-medium text-neutral-black">
        Votre hôte
      </h2>

      <div className="mt-8 flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-neutral-light-grey">
          {host?.picture ? (
            <Image
              src={host.picture}
              alt={`Portrait de ${host.name}`}
              fill
              loading="eager"
              sizes="80px"
              className="object-cover object-center"
            />
          ) : (
            <Image
              src="/images/Portrait_Placeholder.png"
              alt={`Portrait de ${host?.name ?? "l’hôte"}`}
              fill
              loading="eager"
              sizes="80px"
              className="object-cover object-center"
            />
          )}
        </div>

        <p className="min-w-0 flex-1 font-medium text-neutral-black">
          {host?.name ?? "Hôte non renseigné"}
        </p>
        <span className="flex items-center gap-1 rounded-md bg-neutral-light-grey px-3 py-2 text-neutral-black">
          <StarIcon className="size-4 text-brand-main-red" />
          {property.rating_avg.toFixed(0)}
        </span>
      </div>

      <div className="mt-8 grid gap-2">
        <Button className="w-full text-neutral-white">Contacter l’hôte</Button>
        <Button className="w-full text-neutral-white">Envoyer un message</Button>
      </div>
    </aside>
  );
}