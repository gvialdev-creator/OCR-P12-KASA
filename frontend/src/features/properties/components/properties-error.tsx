export function PropertiesError() {
  return (
    <div
      role="alert"
      className="rounded-md border border-brand-main-red bg-neutral-white p-page text-center"
    >
      <p className="font-medium text-brand-main-red">
        Les logements ne peuvent pas être chargés pour le moment.
      </p>
      <p className="mt-2 text-sm text-neutral-dark-grey">
        Veuillez réessayer dans quelques instants.
      </p>
    </div>
  );
}