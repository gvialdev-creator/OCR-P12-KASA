"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { ApiError } from "@/api/errors";
import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { isValidEmail, isValidNewPassword } from "@/features/auth/validation";
import { changeAccountPassword, updateAccountProfile, uploadProfilePicture } from "@/features/account/services/account";

export interface AccountFormState {
  error: string | null;
  success: string | null;
}

export async function updateAccountProfileAction(
  _previousState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!token || !user) return { error: "Votre session a expiré. Reconnectez-vous.", success: null };

  const familyName = String(formData.get("familyName") ?? "").trim();
  const givenName = String(formData.get("givenName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const fileValue = formData.get("picture");
  const picture = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if (!familyName || !givenName || !isValidEmail(email)) {
    return { error: "Renseignez votre nom, votre prénom et une adresse email valide.", success: null };
  }
  if (picture && !["owner", "admin"].includes(user.role)) {
    return { error: "La modification de la photo est réservée aux propriétaires et aux administrateurs.", success: null };
  }
  if (picture && (!picture.type.startsWith("image/") || picture.size > 10 * 1024 * 1024)) {
    return { error: "Choisissez une image de 10 Mo maximum.", success: null };
  }

  try {
    const profilePicture = picture ? await uploadProfilePicture(picture, token) : undefined;
    await updateAccountProfile(user.id, {
      name: `${givenName} ${familyName}`,
      email,
      ...(profilePicture ? { picture: profilePicture } : {}),
    }, token);
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : "Une erreur est survenue. Réessayez plus tard.",
      success: null,
    };
  }

  revalidatePath("/account");
  return { error: null, success: "Vos informations personnelles ont été mises à jour." };
}

export async function updateAccountPasswordAction(
  _previousState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!token || !user) return { error: "Votre session a expiré. Reconnectez-vous.", success: null };

  const password = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (!isValidNewPassword(password)) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.", success: null };
  }
  if (password !== confirmation) {
    return { error: "Les deux mots de passe ne correspondent pas.", success: null };
  }

  try {
    await changeAccountPassword(user.id, password, token);
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : "Une erreur est survenue. Réessayez plus tard.",
      success: null,
    };
  }

  revalidatePath("/account");
  return { error: null, success: "Votre mot de passe a été modifié." };
}