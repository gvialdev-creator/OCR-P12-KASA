import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CircleQuestionIcon } from "@/components/ui/icons";
import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { listPendingOwnerRequests } from "@/features/owner-requests/services/owner-requests";

export const metadata: Metadata = {
  title: "Tableau de bord admin | Kasa",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!user) redirect("/login");
  if (user.role !== "admin") notFound();

  let pendingRequestCount: number | null = null;
  try {
    pendingRequestCount = (await listPendingOwnerRequests(token!)).length;
  } catch {
    // Keep the dashboard available even if the requests service is temporarily unreachable.
  }

  return (
    <main className="container-app flex-1 py-section">
      <h1 className="text-xl font-semibold">Tableau de bord admin</h1>
      <Link
        href="/admin/owner-requests"
        className="mt-6 block max-w-md rounded-md border border-neutral-light-grey bg-neutral-white p-5 transition-colors hover:border-brand-main-red focus-visible:outline-2 focus-visible:outline-brand-main-red"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-black">
          <CircleQuestionIcon width={20} height={20} />
          <span>Demandes propriétaires</span>
        </h2>
        {pendingRequestCount === null ? (
          <p className="mt-2 text-sm text-neutral-dark-grey">Nombre de demandes en cours indisponible.</p>
        ) : (
          <p className="mt-2 text-sm text-neutral-dark-grey">
            {pendingRequestCount} demande{pendingRequestCount === 1 ? "" : "s"} en cours
          </p>
        )}
      </Link>
    </main>
  );
}