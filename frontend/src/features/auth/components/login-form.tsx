"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "@/features/auth/actions/login";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-44">
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  );
}

export function LoginForm({ returnTo = "/" }: { returnTo?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="mx-auto mt-8 w-full max-w-70 space-y-5">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-neutral-black">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-9 w-full rounded-sm border border-neutral-light-grey bg-neutral-white px-3 text-sm text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-neutral-black">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-9 w-full rounded-sm border border-neutral-light-grey bg-neutral-white px-3 text-sm text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red"
        />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="text-sm text-brand-main-red">
          {state.error}
        </p>
      )}
      <div className="flex flex-col items-center gap-4 pt-2 text-center text-sm">
        <SubmitButton />
        <span className="text-neutral-dark-grey">Mot de passe oublié</span>
        <p>
          Pas encore de compte ?{" "}
          <Link href="/sign-in" className="text-brand-main-red underline-offset-2 hover:underline focus-visible:underline">
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </form>
  );
}