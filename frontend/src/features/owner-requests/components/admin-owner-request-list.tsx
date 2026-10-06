"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { decideOwnerRequestAction } from "@/features/owner-requests/actions/owner-requests";
import type { OwnerRequestAdmin } from "@/features/owner-requests/types";

export function AdminOwnerRequestList({ initialRequests }: { initialRequests: OwnerRequestAdmin[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function decide(id: number, decision: "approve" | "reject") {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await decideOwnerRequestAction(id, decision);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRequests((current) => current.filter((request) => request.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-brand-main-red">{error}</p>}
      {requests.length === 0 ? <p className="py-6 text-sm text-neutral-dark-grey">Aucune demande en attente.</p> : (
        <ul className="divide-y divide-neutral-light-grey">
          {requests.map((request) => <li key={request.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{request.name}</p>
              <p className="text-sm text-neutral-dark-grey">{request.email ?? "Adresse e-mail indisponible"}</p>
              <p className="mt-1 text-xs text-neutral-dark-grey">Reçue le {new Date(request.submitted_at).toLocaleString("fr-FR")}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" disabled={isPending} onClick={() => decide(request.id, "approve")} >{pendingId === request.id ? "Traitement…" : "Accepter"}</Button>
              <Button type="button" disabled={isPending} onClick={() => decide(request.id, "reject")} className=" bg-neutral-dark-grey hover:bg-neutral-black">Refuser</Button>
            </div>
          </li>)}
        </ul>
      )}
    </div>
  );
}