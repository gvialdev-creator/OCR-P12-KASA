"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { createPropertyAction } from "@/features/properties/actions/create-property";

const inputClass = "mt-1 w-full rounded-sm border border-neutral-light-grey bg-neutral-white px-3 py-2 text-sm text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red";
const equipments = ["Micro Ondes", "Clic-clac", "Douche italienne", "Four", "Frigo", "Rangements", "WiFi", "Lit", "Parking", "Bouilloire", "Sèche Cheveux", "TV", "Machine à laver", "Cinéma", "Cuisine équipée", "Baie vitrée", "Télévision", "Baignoire", "Chambre séparée", "Vue Parc", "Climatisation"];
const categories = ["Parc", "Night Life", "Culture", "Nature", "Touristique", "Vue sur mer", "Pour les couples", "Famille", "Forêt"];

function ImagePreview({ file, label }: { file: File; label: string }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <Image src={url} alt={label} width={100} height={76} unoptimized className="h-19 w-25 rounded-sm object-cover" />;
}

export function CreatePropertyForm() {
  const [fields, setFields] = useState({ title: "", description: "", postal_code: "", location: "", price_per_night: "", customTag: "" });
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [pictures, setPictures] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(async (previous: { error: string | null }, formData: FormData) => {
    if (cover) formData.set("cover", cover);
    pictures.forEach((file) => formData.append("pictures", file));
    return createPropertyAction(previous, formData);
  }, { error: null });

  function updateField(name: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function toggleSelection(value: string, selected: string[], update: (values: string[]) => void) {
    update(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function addCustomTag() {
    const tag = fields.customTag.trim();
    if (!tag || selectedTags.includes(tag)) return;
    setSelectedTags((current) => [...current, tag]);
    updateField("customTag", "");
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => formAction(data)); }} className="mx-auto max-w-5xl space-y-6">
      <Link href="/" className="inline-flex items-center rounded-sm bg-neutral-light-grey px-3 py-2 text-sm text-neutral-black hover:text-brand-main-red">← Retour</Link>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-black">Ajouter une propriété</h1>
        <Button type="submit" disabled={pending || Boolean(fileError)}>{pending ? "Ajout en cours…" : "Ajouter"}</Button>
      </div>
      {state.error && <p role="alert" className="text-sm text-brand-main-red">{state.error}</p>}
      {fileError && <p role="alert" className="text-sm text-brand-main-red">{fileError}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Informations du logement" className="space-y-4 rounded-md border border-neutral-light-grey bg-neutral-white p-6 sm:p-10">
          <label className="block text-sm">Titre de la propriété<input name="title" required maxLength={150} value={fields.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ex : Appartement cosy au cœur de Paris" className={inputClass} /></label>
          <label className="block text-sm">Description<textarea name="description" rows={5} value={fields.description} onChange={(event) => updateField("description", event.target.value)} className={inputClass} placeholder="Décrivez votre propriété en détail…" /></label>
          <label className="block text-sm">Code postal<input name="postal_code" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} title="Code postal à 5 chiffres" value={fields.postal_code} onChange={(event) => updateField("postal_code", event.target.value)} className={inputClass} /></label>
          <label className="block text-sm">Localisation<input name="location" required value={fields.location} onChange={(event) => updateField("location", event.target.value)} className={inputClass} /></label>
          <label className="block text-sm">Prix par nuit (€)<input name="price_per_night" type="number" required min="1" step="1" value={fields.price_per_night} onChange={(event) => updateField("price_per_night", event.target.value)} className={inputClass} /></label>
        </section>
        <section aria-label="Photos du logement" className="space-y-5 rounded-md border border-neutral-light-grey bg-neutral-white p-6 sm:p-10">
          <div>
            <label htmlFor="cover" className="block text-sm">Image de couverture *</label>
            <input id="cover" type="file" accept="image/*" aria-required="true" className={inputClass} onChange={(event) => { setCover(event.target.files?.[0] ?? null); event.target.value = ""; }} />
            <p className="mt-1 text-xs text-neutral-dark-grey">Image de 10 Mo maximum.</p>
            {cover && <div className="mt-2"><ImagePreview key={`${cover.name}-${cover.size}-${cover.lastModified}`} file={cover} label="Aperçu de la couverture" /></div>}
          </div>
          <div>
            <label htmlFor="pictures" className="block text-sm">Images du logement (8 maximum)</label>
            <input id="pictures" type="file" accept="image/*" multiple className={inputClass} onChange={(event) => { const files = [...pictures, ...Array.from(event.target.files ?? [])]; setFileError(files.length > 8 ? "8 photos maximum pour la galerie." : null); if (files.length <= 8) setPictures(files); event.target.value = ""; }} />
            <p className="mt-1 text-xs text-neutral-dark-grey">10 Mo maximum par image.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pictures.map((file, index) => (
                <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="relative">
                  <ImagePreview file={file} label={`Aperçu de la photo ${index + 1}`} />
                  <button type="button" aria-label={`Retirer la photo ${index + 1}`} onClick={() => { setPictures((current) => current.filter((_, imageIndex) => imageIndex !== index)); setFileError(null); }} className="absolute right-0 top-0 rounded-sm bg-neutral-white px-1 text-brand-main-red">×</button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <fieldset className="rounded-md border border-neutral-light-grey bg-neutral-white p-6 sm:p-10">
          <legend className="sr-only">Équipements</legend>
          <h2 className="mb-4 text-base font-semibold">Équipements</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {equipments.map((equipment) => <label key={equipment} className="flex items-center gap-2 text-sm"><input type="checkbox" name="equipments" value={equipment} checked={selectedEquipments.includes(equipment)} onChange={() => toggleSelection(equipment, selectedEquipments, setSelectedEquipments)} className="accent-brand-main-red" />{equipment}</label>)}
          </div>
        </fieldset>
        <fieldset className="self-start rounded-md border border-neutral-light-grey bg-neutral-white p-6 sm:p-10">
          <legend className="sr-only">Catégories</legend>
          <h2 className="mb-4 text-base font-semibold">Catégories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => <label key={category} className="cursor-pointer rounded-sm bg-neutral-light-grey px-3 py-2 text-sm has-checked:bg-brand-main-red has-checked:text-neutral-white"><input className="sr-only" type="checkbox" name="tags" value={category} checked={selectedTags.includes(category)} onChange={() => toggleSelection(category, selectedTags, setSelectedTags)} />{category}</label>)}
            {selectedTags.filter((tag) => !categories.includes(tag)).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-sm bg-brand-main-red px-2 py-1 text-sm text-neutral-white">
                <input type="hidden" name="tags" value={tag} />{tag}
                <button type="button" aria-label={`Retirer la catégorie ${tag}`} onClick={() => setSelectedTags((current) => current.filter((item) => item !== tag))} className="cursor-pointer px-1">×</button>
              </span>
            ))}
          </div>
          <div className="mt-6 text-sm">
            <label htmlFor="customTag">Ajouter une catégorie personnalisée</label>
            <div className="flex items-end gap-2"><input id="customTag" name="customTag" maxLength={80} value={fields.customTag} onChange={(event) => updateField("customTag", event.target.value)} placeholder="Nouveau tag" className={inputClass} /><Button type="button" iconOnly icon={<PlusIcon className="size-4" />} onClick={addCustomTag} className="mb-0.5 shrink-0">Ajouter la catégorie</Button></div>
          </div>
        </fieldset>
      </div>
    </form>
  );
}