import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { listPendingOwnerRequests } from "@/features/owner-requests/services/owner-requests";
import { AdminOwnerRequestList } from "@/features/owner-requests/components/admin-owner-request-list";

export const metadata: Metadata = { title: "Demandes propriétaire | Kasa", robots: { index: false, follow: false } };

export default async function AdminOwnerRequestsPage() {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!user) redirect("/login");
  if (user.role !== "admin") notFound();

  let requests = [];
  try {
    requests = await listPendingOwnerRequests(token!);
  } catch {
    return <main className="container-app flex-1 py-section"><h1 className="text-xl font-semibold">Demandes propriétaire</h1><p role="alert" className="mt-4 text-sm text-brand-main-red">Impossible de charger les demandes. Actualisez la page.</p></main>;
  }

  return <main className="container-app flex-1 py-section"><h1 className="mb-5 text-xl font-semibold">Demandes propriétaire</h1><section aria-label="Demandes en attente" className="rounded-md border border-neutral-light-grey bg-neutral-white px-5 sm:px-8"><AdminOwnerRequestList initialRequests={requests} /></section></main>;
}