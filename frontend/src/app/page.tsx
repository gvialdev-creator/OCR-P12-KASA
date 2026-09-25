import { Suspense } from "react";

import type { Property } from "@/domain/types/property";
import { HomeHero, HowItWorks } from "@/features/home/components";
import {
  PropertiesError,
  PropertyGrid,
  PropertyGridSkeleton,
} from "@/features/properties/components";
import { getProperties } from "@/features/properties/services/get-properties";

export const dynamic = "force-dynamic";

type PropertiesResult =
  | { properties: Property[]; failed: false }
  | { properties: null; failed: true };

async function loadProperties(): Promise<PropertiesResult> {
  // pour tester le chargement suspendu
  // await new Promise((resolve) => setTimeout(resolve, 5000));
  try {
    const properties = await getProperties();

    return { properties, failed: false };
  } catch {
    return { properties: null, failed: true };
  }
}

async function PropertiesContent() {
  const result = await loadProperties();

  if (result.failed) {
    return <PropertiesError />;
  }

  return <PropertyGrid properties={result.properties} />;
}

export default function Home() {
  return (
    <main className="container-app flex-1 space-y-10 py-section">
      <HomeHero />

      <section aria-labelledby="properties-title">
        <h2 id="properties-title" className="sr-only">
          Logements disponibles
        </h2>
        <Suspense fallback={<PropertyGridSkeleton />}>
          <PropertiesContent />
        </Suspense>
      </section>

      <HowItWorks />
    </main>
  );
}
