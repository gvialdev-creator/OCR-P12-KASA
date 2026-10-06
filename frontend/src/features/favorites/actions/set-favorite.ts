"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { ApiError } from "@/api/errors";
import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { setPropertyFavorite } from "@/features/favorites/services/favorites";

export interface SetFavoriteResult {
  favorite: boolean;
  error: string | null;
}

export async function setFavoriteAction(propertyId: string, favorite: boolean): Promise<SetFavoriteResult> {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!token || !user) return { favorite: !favorite, error: "Votre session a expiré. Reconnectez-vous." };
  if (!propertyId || typeof propertyId !== "string" || typeof favorite !== "boolean") {
    return { favorite: !favorite, error: "Cette action n’est pas valide." };
  }

  try {
    await setPropertyFavorite(propertyId, favorite, token);
  } catch (error) {
    return {
      favorite: !favorite,
      error: error instanceof ApiError ? error.message : "Impossible de modifier ce favori.",
    };
  }

  revalidatePath("/");
  revalidatePath("/favorites");
  return { favorite, error: null };
}