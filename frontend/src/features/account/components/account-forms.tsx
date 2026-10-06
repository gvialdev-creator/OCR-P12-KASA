"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/features/auth/services/has-valid-session";
import { passwordPattern } from "@/features/auth/validation";
import {
  updateAccountPasswordAction,
  updateAccountProfileAction,
  type AccountFormState,
} from "@/features/account/actions/update-account";

const inputClassName = "h-10 w-full rounded-sm border border-neutral-light-grey bg-neutral-white px-3 text-sm text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red";
const initialState: AccountFormState = { error: null, success: null };
const roleLabels: Record<SessionUser["role"], string> = {
  client: "Client",
  owner: "Propriétaire",
  admin: "Administrateur",
};

function ProfilePicturePreview({ file, fallbackSrc, name }: { file: File | null; fallbackSrc: string; name: string }) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    let active = true;
    queueMicrotask(() => {
      if (active) setPreview({ file, url: objectUrl });
    });
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const src = file && preview?.file === file ? preview.url : fallbackSrc;

  return (
    <Image
      src={src}
      alt={`Photo de profil de ${name}`}
      width={96}
      height={96}
      unoptimized
      className="size-24 rounded-sm object-cover"
    />
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

interface AccountFormsProps {
  user: SessionUser;
  givenName: string;
  familyName: string;
}

export function AccountForms({ user, givenName, familyName }: AccountFormsProps) {
  const [profileState, profileAction] = useActionState(updateAccountProfileAction, initialState);
  const [passwordState, passwordAction] = useActionState(updateAccountPasswordAction, initialState);
  const [selectedPicture, setSelectedPicture] = useState<File | null>(null);
  const canEditPicture = user.role === "owner" || user.role === "admin";

  return (
    <div className="space-y-8">
      <section aria-labelledby="personal-info-title" className="rounded-md border border-neutral-light-grey bg-neutral-white p-5 sm:p-8">
        <h2 id="personal-info-title" className="mb-6 text-lg font-semibold text-neutral-black">Informations personnelles</h2>
        <form action={profileAction} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label htmlFor="account-family-name" className="block text-sm text-neutral-black">
              Nom
              <input id="account-family-name" name="familyName" type="text" autoComplete="family-name" defaultValue={familyName} required maxLength={100} className={`${inputClassName} mt-1`} />
            </label>
            <label htmlFor="account-given-name" className="block text-sm text-neutral-black">
              Prénom
              <input id="account-given-name" name="givenName" type="text" autoComplete="given-name" defaultValue={givenName} required maxLength={100} className={`${inputClassName} mt-1`} />
            </label>
          </div>
          <label htmlFor="account-email" className="block text-sm text-neutral-black">
            Adresse email
            <input id="account-email" name="email" type="email" autoComplete="email" defaultValue={user.email ?? ""} required maxLength={254} className={`${inputClassName} mt-1`} />
          </label>
          <div className="text-sm text-neutral-black">
            <p className="mb-1">Rôle du compte</p>
            <p aria-label="Rôle du compte" className="rounded-sm border border-neutral-light-grey bg-neutral-light-grey px-3 py-2">
              {roleLabels[user.role]}
            </p>
          </div>
          {canEditPicture && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-black">Photo de profil</p>
              <ProfilePicturePreview
                file={selectedPicture}
                fallbackSrc={user.picture || "/images/Portrait_Placeholder.png"}
                name={user.name}
              />
              <label htmlFor="account-picture" className="block text-sm text-neutral-black">
                Modifier la photo
                <input id="account-picture" name="picture" type="file" accept="image/*" onChange={(event) => setSelectedPicture(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-brand-light-orange file:px-3 file:py-2 file:text-sm file:text-neutral-black" />
              </label>
              <p className="text-xs text-neutral-dark-grey">Image uniquement, 10 Mo maximum.</p>
            </div>
          )}
          {profileState.error && <p role="alert" className="text-sm text-brand-main-red">{profileState.error}</p>}
          {profileState.success && <p role="status" className="text-sm text-neutral-black">{profileState.success}</p>}
          <SubmitButton label="Enregistrer mes informations" pendingLabel="Enregistrement…" />
        </form>
      </section>

      <section aria-labelledby="password-title" className="rounded-md border border-neutral-light-grey bg-neutral-white p-5 sm:p-8">
        <h2 id="password-title" className="mb-6 text-lg font-semibold text-neutral-black">Modifier le mot de passe</h2>
        <form action={passwordAction} className="space-y-5">
          <label htmlFor="account-new-password" className="block text-sm text-neutral-black">
            Nouveau mot de passe
            <input id="account-new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} pattern={passwordPattern} title="8 caractères minimum, avec majuscule, minuscule, chiffre et symbole" required className={`${inputClassName} mt-1`} />
          </label>
          <label htmlFor="account-confirm-password" className="block text-sm text-neutral-black">
            Confirmation du nouveau mot de passe
            <input id="account-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required className={`${inputClassName} mt-1`} />
          </label>
          <p className="text-xs text-neutral-dark-grey">8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un symbole.</p>
          {passwordState.error && <p role="alert" className="text-sm text-brand-main-red">{passwordState.error}</p>}
          {passwordState.success && <p role="status" className="text-sm text-neutral-black">{passwordState.success}</p>}
          <SubmitButton label="Modifier le mot de passe" pendingLabel="Modification…" />
        </form>
      </section>
    </div>
  );
}