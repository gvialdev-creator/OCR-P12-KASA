const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export function PropertyGridSkeleton() {
  return (
    <div
      className="grid gap-component sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Chargement des logements</span>
      {skeletonCards.map((index) => (
        <div
          key={index}
          className="h-full overflow-hidden rounded-md bg-neutral-white shadow-card"
          aria-hidden="true"
        >
          <div className="aspect-4/3 bg-neutral-light-grey motion-safe:animate-pulse" />
          <div className="space-y-3 p-component">
            <div className="h-5 w-4/5 rounded-sm bg-neutral-light-grey motion-safe:animate-pulse" />
            <div className="h-4 w-3/5 rounded-sm bg-neutral-light-grey motion-safe:animate-pulse" />
            <div className="flex justify-between pt-1">
              <div className="h-4 w-2/5 rounded-sm bg-neutral-light-grey motion-safe:animate-pulse" />
              <div className="h-4 w-1/4 rounded-sm bg-neutral-light-grey motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}