import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { CreatePropertyForm } from "@/features/properties/components/create-property-form";

export const metadata: Metadata = { title: "Ajouter un logement | Kasa", robots: { index: false, follow: false } };

export default async function NewPropertyPage() {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!user) redirect("/login");
  if (user.role !== "owner" && user.role !== "admin") notFound();

  return <main className="container-app flex-1 py-section"><CreatePropertyForm /></main>;
}