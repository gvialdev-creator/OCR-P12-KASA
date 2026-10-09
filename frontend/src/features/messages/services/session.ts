import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSafeReturnTo } from "@/features/auth/return-to";
import { getSessionUser } from "@/features/auth/services/has-valid-session";

export function messagingLogin(returnTo: string): never {
  redirect(`/login?returnTo=${encodeURIComponent(getSafeReturnTo(returnTo) || "/messages")}`);
}

export async function messagingSession(returnTo = "/messages") {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!token || !user) messagingLogin(returnTo);
  return { token, user };
}