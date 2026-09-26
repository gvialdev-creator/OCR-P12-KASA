const steps = [
  {
    number: "01",
    title: "Recherchez",
    description:
      "Entrez votre destination, vos dates et laissez Kasa faire le reste",
  },
  {
    number: "02",
    title: "Réservez",
    description:
      "Profitez d’une plateforme sécurisée et de profils d’hôtes vérifiés.",
  },
  {
    number: "03",
    title: "Vivez l’expérience",
    description:
      "Installez-vous, profitez de votre séjour, et sentez-vous chez vous, partout.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title">
        <div className="bg-neutral-white p-section">
            <h2
                id="how-it-works-title"
                className="text-center text-2xl font-bold text-neutral-black sm:text-3xl"
            >
                Comment ça marche ?
            </h2>
            <p className="mx-auto mt-2 max-w-3xl text-center text-sm leading-7">
            Que vous partiez pour un week-end improvisé, des vacances en famille ou un voyage professionnel, 
            Kasa vous aide à trouver un lieu qui vous ressemble.
            </p>
            <ol className="mt-section flex flex-wrap gap-4">
                {steps.map((step) => (
                <li
                    key={step.number}
                    className="md:max-w-67.5 rounded-md bg-brand-dark-orange py-11 px-5.5 text-neutral-white border border-neutral-light-grey"
                >                    
                    <h3 className="text-lg font-medium ">
                    {step.title}
                    </h3>
                    <p className="mt-4 text-xs">
                    {step.description}
                    </p>
                </li>
                ))}
            </ol>
        </div>
        
      
    </section>
  );
}