"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { getMyOwnerRequestAction, submitOwnerRequestAction } from "@/features/owner-requests/actions/owner-requests";

export function OwnerRequestDialog({ mobile = false }: { mobile?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "pending" | "submitted" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function openDialog() {
    if (mobile) document.dispatchEvent(new CustomEvent("kasa:close-mobile-menu"));
    setStatus("checking");
    setError(null);
    setOpen(true);
    startTransition(async () => {
      const result = await getMyOwnerRequestAction();
      if (result.error) {
        setError(result.error);
        setStatus("error");
      } else {
        setStatus(result.request?.status === "pending" ? "pending" : "ready");
      }
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitOwnerRequestAction();
      if (result.error) {
        setError(result.error);
        setStatus("error");
      } else {
        setStatus("submitted");
      }
    });
  }

  return (
    <>
      <Button type="button" data-open-owner-dialog="true" onClick={openDialog} className={mobile ? "mt-3 self-start" : "h-auto bg-transparent px-0 text-brand-main-red! hover:bg-transparent hover:text-brand-dark-orange!"} icon={!mobile ? <PlusIcon className="size-4" /> : undefined}>
        Ajouter un logement
      </Button>
      {open && createPortal(<dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,32rem)] rounded-md border border-neutral-light-grey bg-neutral-white p-0 text-neutral-black shadow-menu backdrop:bg-neutral-black/50"
        onClose={() => setOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
      >
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold">Demander le statut propriétaire</h2>
            <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="cursor-pointer rounded-sm px-2 text-xl text-neutral-dark-grey hover:text-brand-main-red">×</button>
          </div>
          {status === "checking" || isPending ? <p role="status">Vérification en cours…</p> : null}
          {status === "ready" && !isPending && <>
            <p className="text-sm text-neutral-dark-grey">Soumettre une demande pour pouvoir publier des logements sur Kasa.</p>
            <Button type="button" onClick={submit} >Envoyer ma demande</Button>
          </>}
          {status === "pending" && !isPending && <p role="status" className="text-sm">Une demande est déjà en attente de traitement.</p>}
          {status === "submitted" && <p role="status" className="text-sm">Votre demande a bien été envoyée. Un administrateur va l’examiner.</p>}
          {status === "error" && error && <p role="alert" className="text-sm text-brand-main-red">{error}</p>}
        </div>
      </dialog>, document.body)}
    </>
  );
}