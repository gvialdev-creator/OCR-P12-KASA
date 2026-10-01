"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError } from "@/api/errors";
import { loginWithApi } from "@/features/auth/services/login";

export interface LoginState {
  error: string | null;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const password = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || !password) {
    return { error: "Saisissez une adresse email valide et un mot de passe." };
  }

  let token: string;
  try {
    token = await loginWithApi(email, password);
  } catch (error) {
    return {
      error: error instanceof ApiError
        ? error.message
        : "Une erreur est survenue. Réessayez plus tard.",
    };
  }

  (await cookies()).set("kasa_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/");
}