import Image from "next/image";

export function HomeHero() {
  return (
    <section>
      <h1 className="text-center text-[32px] font-bold text-brand-main-red">
        Chez vous, partout et ailleurs
      </h1>

      <p className="mx-auto mt-2 max-w-3xl text-center text-sm leading-7 text-neutral-dark-grey">
        Avec Kasa, vivez des séjours uniques dans des hébergements chaleureux,
        sélectionnés avec soin par nos hôtes.
      </p>

      <div className="relative mt-10 overflow-hidden rounded-2xl h-114.5">
        <Image
          src="/images/home-hero.webp"
          alt="Appartement lumineux proposé à la location sur Kasa"
          fill
          preload
          loading="eager"
          sizes="(max-width: 1168px) 100vw, 1120px"
          className="object-cover"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}