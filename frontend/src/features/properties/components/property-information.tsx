import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { PinIcon } from "@/components/ui/icons";
import type { PropertyDetail } from "@/domain/types/property";

interface PropertyInformationProps {
  property: PropertyDetail;
}

function ItemList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-dark-grey">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-sm bg-neutral-light-grey px-4 py-2 text-sm text-neutral-dark-grey"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PropertyInformation({ property }: PropertyInformationProps) {
  return (
    <section className="rounded-lg bg-neutral-white p-page shadow-card">
      <h1 className="text-2xl font-bold text-neutral-black sm:text-3xl">
        {property.title}
      </h1>
      <p className="mt-4 flex items-center gap-2 text-sm text-neutral-dark-grey">
        <PinIcon className="size-4 shrink-0" />
        {[property.postal_code, property.location].filter(Boolean).join(" ") || "Localisation non renseignée"}
      </p>

      <p className="mt-10 leading-7 text-neutral-black">
        {property.description ?? "Aucune description n’est disponible pour ce logement."}
      </p>

      <div className="mt-8 space-y-5">
        <CollapsibleSection title="Équipements">
          <ItemList
            items={property.equipments}
            emptyLabel="Aucun équipement renseigné."
          />
        </CollapsibleSection>
        <CollapsibleSection title="Catégorie">
          <ItemList items={property.tags} emptyLabel="Aucune catégorie renseignée." />
        </CollapsibleSection>
      </div>
    </section>
  );
}