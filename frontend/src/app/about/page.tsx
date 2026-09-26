import type { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
  const aboutUrl = siteUrl ? `${siteUrl}/about` : undefined;
  const description =
    "Chez Kasa, nous croyons que chaque voyage mérite un lieu unique où se sentir bien.";

  return {
    title: "À propos | Kasa",
    description,
    ...(aboutUrl && {
      alternates: { canonical: aboutUrl },
    }),
    openGraph: {
      title: "À propos | Kasa",
      description,
      type: "website",
      ...(aboutUrl && { url: aboutUrl }),
      images: [{ url: "/images/about-hero.webp", alt: "À propos chez Kasa" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "À propos | Kasa",
      description,
      images: ["/images/about-hero.webp"],
    },
  };
}

export default function AboutPage() {
  return (
    <main className="container-app flex-1 py-[28px] md:py-10">
      <article
        aria-labelledby="about-title"
        className="mx-auto max-w-[1168px]"
      >
        <header className="mb-8 text-center">
          <h1
            id="about-title"
            className="text-[32px] font-bold leading-none text-brand-main-red"
          >
            À propos
          </h1>
        </header>

        <section className="mx-auto max-w-[980px] space-y-6 text-center text-[18px] leading-8 text-neutral-dark-grey">
          <p>
            Chez Kasa, nous croyons que chaque voyage mérite un lieu unique où se
            sentir bien.
          </p>

          <p>
            Depuis notre création, nous mettons en relation des voyageurs en quête
            d’authenticité avec des hôtes passionnés qui aiment partager leur région
            et leurs bonnes adresses.
          </p>
        </section>

        <div className="mt-8 overflow-hidden rounded-[22px]">
          <div className="relative h-[220px] sm:h-[280px] lg:h-[380px]">
            <Image
              src="/images/about-hero.webp"
              alt="Un paysage de montagne avec une maison et un lac"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1120px"
              className="object-cover"
            />
          </div>
        </div>

        <section
          className="mt-8 grid items-center gap-8 lg:grid-cols-[1fr_1.3fr]"
          aria-labelledby="mission-title"
        >
          <div className="max-w-[470px]">
            <h2
              id="mission-title"
              className="mb-5 text-[22px] font-bold text-brand-main-red"
            >
              Notre mission est simple :
            </h2>

            <ol className="list-decimal space-y-4 pl-6 text-[17px] leading-7 text-neutral-dark-grey">
              <li>Offrir une plateforme fiable et simple d’utilisation</li>
              <li>Proposer des hébergements variés et de qualité</li>
              <li>
                Favoriser des échanges humains et chaleureux entre hôtes et voyageurs
              </li>
            </ol>

            <p className="mt-6 text-[17px] leading-7 text-neutral-dark-grey">
              Que vous cherchiez un appartement cosy en centre-ville, une maison en
              bord de mer ou un chalet à la montagne, Kasa vous accompagne pour que
              chaque séjour devienne un souvenir inoubliable.
            </p>
          </div>

          <div className="overflow-hidden rounded-[22px]">
            <div className="relative h-[260px] sm:h-[300px] lg:h-[320px]">
              <Image
                src="/images/about-article.webp"
                alt="Un chalet au bord d'un lac au pied d'une montagne"
                fill
                sizes="(max-width: 768px) 100vw, 760px"
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
