import type { Metadata } from "next";

const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
const termsUrl = siteUrl ? `${siteUrl}/conditions-utilisation` : undefined;

export const metadata: Metadata = {
  title: "Conditions d’utilisation | Kasa",
  description: "Conditions d’utilisation du service Kasa.",
  ...(termsUrl && { alternates: { canonical: termsUrl } }),
};

const sections = [
  {
    title: "1. Présentation du service",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.",
      "Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.",
    ],
  },
  {
    title: "2. Accès et création de compte",
    paragraphs: [
      "Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.",
      "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
    ],
  },
  {
    title: "3. Utilisation de la plateforme",
    paragraphs: [
      "Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor.",
      "Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis.",
    ],
  },
  {
    title: "4. Responsabilités des utilisateurs",
    paragraphs: [
      "Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa.",
      "Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh.",
    ],
  },
  {
    title: "5. Contact",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pour toute question, les modalités de contact seront précisées ici.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <main className="container-app flex-1 py-section">
      <article aria-labelledby="terms-title" className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium text-brand-main-red">
            Informations juridiques
          </p>
          <h1
            id="terms-title"
            className="text-[32px] font-bold text-brand-main-red"
          >
            Conditions d’utilisation
          </h1>
          <p className="mt-3 text-sm text-neutral-dark-grey">
            Contenu provisoire à remplacer par les conditions rédigées et validées
            pour Kasa.
          </p>
        </header>

        <div className="space-y-8 text-sm leading-7 text-neutral-black">
          {sections.map((section, index) => {
            const sectionId = `terms-section-${index + 1}`;

            return (
              <section key={section.title} aria-labelledby={sectionId}>
              <h2
                id={sectionId}
                className="mb-3 text-lg font-semibold text-neutral-black"
              >
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
            );
          })}
        </div>
      </article>
    </main>
  );
}