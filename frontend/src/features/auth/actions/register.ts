"use server";

import { redirect } from "next/navigation";

import { ApiError } from "@/api/errors";
import { registerWithApi } from "@/features/auth/services/register";

export interface RegisterState {
  error: string | null;
}

export async function registerAction(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const familyNameValue = formData.get("familyName");
  const givenNameValue = formData.get("givenName");
  const emailValue = formData.get("email");
  const password = formData.get("password");
  const familyName = typeof familyNameValue === "string" ? familyNameValue.trim() : "";
  const givenName = typeof givenNameValue === "string" ? givenNameValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim() : "";

  if (!familyName || !givenName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || password.length < 6) {
    return { error: "Renseignez nom, prénom, adresse email valide et mot de passe d'au moins 6 caractères." };
  }

  try {
    await registerWithApi(`${givenName} ${familyName}`, email, password);
  } catch (error) {
    return {
      error: error instanceof ApiError
        ? error.message
        : "Une erreur est survenue. Réessayez plus tard.",
    };
  }

  redirect("/login?registered=1");
}