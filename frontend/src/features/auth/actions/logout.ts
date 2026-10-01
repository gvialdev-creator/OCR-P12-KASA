"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<void> {
  (await cookies()).delete("kasa_session");
  revalidatePath("/", "layout");
  redirect("/login");
}