"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { decideOwnerRequest, getMyOwnerRequest, listPendingOwnerRequests, submitOwnerRequest } from "@/features/owner-requests/services/owner-requests";

async function getAuthorizedUser(roles: string[]) {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!token || !user || !roles.includes(user.role)) return null;
  return { token, user };
}

export async function getMyOwnerRequestAction() {
  const auth = await getAuthorizedUser(["client"]);
  if (!auth) return { request: null, error: "Connectez-vous avec un compte client pour consulter votre demande." };
  try {
    return { request: await getMyOwnerRequest(auth.token), error: null };
  } catch {
    return { request: null, error: "Impossible de vérifier l’état de votre demande." };
  }
}

export async function submitOwnerRequestAction() {
  const auth = await getAuthorizedUser(["client"]);
  if (!auth) return { request: null, error: "Votre session ne permet pas de soumettre cette demande." };
  try {
    return { request: await submitOwnerRequest(auth.token), error: null };
  } catch {
    return { request: null, error: "La demande n’a pas pu être envoyée. Elle est peut-être déjà en attente." };
  }
}

export async function listPendingOwnerRequestsAction() {
  const auth = await getAuthorizedUser(["admin"]);
  if (!auth) return { requests: [], error: "Accès administrateur requis." };
  try {
    return { requests: await listPendingOwnerRequests(auth.token), error: null };
  } catch {
    return { requests: [], error: "Impossible de charger les demandes." };
  }
}

export async function decideOwnerRequestAction(id: number, decision: "approve" | "reject") {
  const auth = await getAuthorizedUser(["admin"]);
  if (!auth) return { error: "Accès administrateur requis." };
  try {
    await decideOwnerRequest(id, decision, auth.token);
    revalidatePath("/admin/owner-requests");
    revalidatePath("/");
    return { error: null };
  } catch {
    return { error: "La décision n’a pas pu être enregistrée. Actualisez la liste et réessayez." };
  }
}