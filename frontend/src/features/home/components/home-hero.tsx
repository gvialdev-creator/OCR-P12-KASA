import Image from "next/image";

const heroImage =
  "https://s3-eu-west-1.amazonaws.com/course.oc-static.com/projects/front-end-kasa-project/accommodation-20-1.jpg";

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
          src={heroImage}
          alt="Appartement lumineux proposé à la location sur Kasa"
          fill
          preload
          loading="eager"
          sizes="(max-width: 1168px) 100vw, 1120px"
          className="object-cover"
        />
      </div>
    </section>
  );
}