"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError } from "@/api/errors";
import { getSessionUser } from "@/features/auth/services/has-valid-session";
import { createProperty, deleteUploadedImages, uploadPropertyImage } from "@/features/properties/services/create-property";

export interface CreatePropertyState { error: string | null }

export async function createPropertyAction(_state: CreatePropertyState, formData: FormData): Promise<CreatePropertyState> {
  const token = (await cookies()).get("kasa_session")?.value;
  const user = await getSessionUser(token);
  if (!token || !user || !["owner", "admin"].includes(user.role)) return { error: "Vous n'êtes pas autorisé à publier un logement." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const postalCode = String(formData.get("postal_code") ?? "").trim();
  const price = Number(formData.get("price_per_night"));
  const cover = formData.get("cover");
  const pictures = formData.getAll("pictures").filter((file): file is File => file instanceof File && file.size > 0);
  const files = [cover, ...pictures];
  if (!title || !location || !/^\d{5}$/.test(postalCode) || !Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
    return { error: "Renseignez le titre, la localisation, un code postal à 5 chiffres et un prix entier positif." };
  }
  if (!(cover instanceof File) || !cover.size || pictures.length > 8 || files.some((file) => !(file instanceof File) || !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)) {
    return { error: "Choisissez une couverture et jusqu'à 8 photos, au format image (10 Mo maximum chacune)." };
  }
  const equipments = formData.getAll("equipments").filter((value): value is string => typeof value === "string" && value.length < 80);
  const tags = formData.getAll("tags").filter((value): value is string => typeof value === "string" && value.length < 80);
  const customTag = String(formData.get("customTag") ?? "").trim();
  if (customTag.length > 80) return { error: "La catégorie personnalisée est trop longue." };
  if (customTag) tags.push(customTag);

  const uploaded: string[] = [];
  let id: string;
  let creating = false;
  try {
    for (const file of files as File[]) {
      uploaded.push(await uploadPropertyImage(file, file === cover ? "property-cover" : "property-picture", token));
    }
    creating = true;
    id = await createProperty({
      title, description, location, postal_code: postalCode, price_per_night: price,
      host_id: user.id, cover: uploaded[0], pictures: uploaded.slice(1), equipments, tags: [...new Set(tags)],
    }, token);
  } catch (error) {
    const knownFailure = !creating || (error instanceof ApiError && error.status !== undefined);
    if (knownFailure) {
      await deleteUploadedImages(uploaded, token);
    }
    return { error: knownFailure
      ? "Le logement n'a pas pu être ajouté. Vérifiez vos images ou réessayez plus tard."
      : "Connexion interrompue. Vérifiez si le logement existe déjà avant de réessayer." };
  }

  revalidatePath("/");
  revalidatePath("/properties-data");
  revalidatePath("/sitemap.xml");
  redirect(`/properties/${encodeURIComponent(id)}`);
}