"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { registerAction, type RegisterState } from "@/features/auth/actions/register";

const initialState: RegisterState = { error: null };
const inputClassName = "h-9 w-full rounded-sm border border-neutral-light-grey bg-neutral-white px-3 text-sm text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-44">
      {pending ? "Inscription…" : "S'inscrire"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [email, setEmail] = useState("");
  const errorProps = state.error
    ? { "aria-invalid": true as const, "aria-describedby": "register-error" }
    : {};

  return (
    <form action={formAction} className="mx-auto mt-8 w-full max-w-70 space-y-5 text-left">
      <div>
        <label htmlFor="familyName" className="mb-1 block text-sm text-neutral-black">Nom</label>
        <input id="familyName" name="familyName" type="text" autoComplete="family-name" required value={familyName} onChange={(event) => setFamilyName(event.target.value)} className={inputClassName} {...errorProps} />
      </div>
      <div>
        <label htmlFor="givenName" className="mb-1 block text-sm text-neutral-black">Prénom</label>
        <input id="givenName" name="givenName" type="text" autoComplete="given-name" required value={givenName} onChange={(event) => setGivenName(event.target.value)} className={inputClassName} {...errorProps} />
      </div>
      <div>
        <label htmlFor="register-email" className="mb-1 block text-sm text-neutral-black">Adresse email</label>
        <input id="register-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} {...errorProps} />
      </div>
      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm text-neutral-black">Mot de passe</label>
        <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={6} required className={inputClassName} {...errorProps} />
      </div>
      {state.error && (
        <p id="register-error" role="alert" className="text-sm text-brand-main-red">
          {state.error}
        </p>
      )}
      <div className="flex flex-col items-center gap-4 pt-4 text-center text-sm">
        <SubmitButton />
        <p>
          Déjà membre ?{" "}
          <Link href="/login" className="text-brand-main-red underline-offset-2 hover:underline focus-visible:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  );
}