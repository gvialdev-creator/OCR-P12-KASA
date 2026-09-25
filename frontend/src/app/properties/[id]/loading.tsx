export default function PropertyLoading() {
  return (
    <main className="container-app flex-1 py-section" role="status">
      <span className="sr-only">Chargement du logement</span>
      <div className="mb-component h-9 w-44 rounded-lg bg-neutral-light-grey motion-safe:animate-pulse" />
      <div className="grid items-start gap-component lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="grid gap-component">
          <div className="h-105 rounded-lg bg-neutral-light-grey motion-safe:animate-pulse sm:h-130" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-20 rounded-md bg-neutral-light-grey motion-safe:animate-pulse sm:h-24" />
            ))}
          </div>
          <div className="h-96 rounded-lg bg-neutral-white shadow-card motion-safe:animate-pulse" />
        </div>
        <div className="h-72 rounded-lg bg-neutral-white shadow-card motion-safe:animate-pulse" />
      </div>
    </main>
  );
}