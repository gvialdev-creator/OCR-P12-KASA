"use server";

import { redirect } from "next/navigation";

import { ApiError } from "@/api/errors";
import { registerWithApi } from "@/features/auth/services/register";
import { isValidEmail, isValidNewPassword } from "@/features/auth/validation";

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
  const acceptedTerms = formData.get("acceptTerms") === "on";
  const familyName = typeof familyNameValue === "string" ? familyNameValue.trim() : "";
  const givenName = typeof givenNameValue === "string" ? givenNameValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim() : "";

  if (!familyName || !givenName || !isValidEmail(email)) {
    return { error: "Renseignez nom, prénom et une adresse email valide." };
  }
  if (typeof password !== "string" || !isValidNewPassword(password)) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole." };
  }
  if (!acceptedTerms) {
    return { error: "Vous devez accepter les conditions d’utilisation pour créer un compte." };
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