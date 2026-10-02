"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { createPropertyAction } from "@/features/properties/actions/create-property";

const inputClass = "mt-1 w-full rounded-sm border border-neutral-light-grey bg-neutral-white px-3 py-2 text-sm text-neutral-black focus-visible:outline-2 focus-visible:outline-brand-main-red";
const equipments = ["Micro Ondes", "Clic-clac", "Douche italienne", "Four", "Frigo", "Rangements", "WiFi", "Lit", "Parking", "Bouilloire", "Sèche Cheveux", "TV", "Machine à laver", "Cinéma", "Cuisine équipée", "Baie vitrée", "Télévision", "Baignoire", "Chambre séparée", "Vue Parc", "Climatisation"];
const categories = ["Parc", "Night Life", "Culture", "Nature", "Touristique", "Vue sur mer", "Pour les couples", "Famille", "Forêt"];

function ImagePreview({ file, label, className = "h-19 w-25" }: { file: File; label: string; className?: string }) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    let active = true;
    queueMicrotask(() => {
      if (active) setPreview({ file, url: objectUrl });
    });
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);
  return preview?.file === file ? <Image src={preview.url} alt={label} width={100} height={76} unoptimized className={`${className} rounded-sm object-cover`} /> : null;
}

function ImageUploadField({ id, label, file, onChange, ariaRequired = false, previewLabel, inputRef }: { id: string; label: string; file: File | null; onChange: (file: File | null) => void; ariaRequired?: boolean; previewLabel?: string; inputRef?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <div className="flex h-6 min-w-0 flex-1 items-center gap-1 focus-within:outline-2 focus-within:outline-brand-main-red">
      <input ref={inputRef} id={id} type="file" accept="image/*" aria-required={ariaRequired || undefined} className="sr-only" onChange={(event) => { onChange(event.target.files?.[0] ?? null); event.target.value = ""; }} />
      <label htmlFor={id} className="flex h-6 min-w-0 flex-1 cursor-pointer items-center gap-1 overflow-hidden rounded-sm border border-neutral-light-grey bg-neutral-white px-2 text-xs text-neutral-dark-grey">
        <span className="sr-only">{label}</span>
        {file && <ImagePreview file={file} label={previewLabel ?? `Aperçu de ${label}`} className="size-5 shrink-0" />}
        <span className="truncate">{file?.name ?? ""}</span>
        <span aria-hidden="true" className="-mr-2 ml-auto flex size-6 shrink-0 items-center justify-center rounded-sm bg-brand-main-red text-neutral-white"><PlusIcon className="size-3" /></span>
      </label>
    </div>
  );
}

export function CreatePropertyForm() {
  const [fields, setFields] = useState({ title: "", description: "", postal_code: "", location: "", price_per_night: "", hostName: "" });
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const [pictureFields, setPictureFields] = useState<{ id: number; file: File | null }[]>([{ id: 0, file: null }]);
  const [nextPictureId, setNextPictureId] = useState(1);
  const [customTagFields, setCustomTagFields] = useState<{ id: number; value: string }[]>([{ id: 0, value: "" }]);
  const [nextCustomTagId, setNextCustomTagId] = useState(1);
  const [state, formAction, pending] = useActionState(async (previous: { error: string | null }, formData: FormData) => {
    if (cover) formData.set("cover", cover);
    if (profilePicture) formData.set("profile_picture", profilePicture);
    pictureFields.forEach(({ file }) => { if (file) formData.append("pictures", file); });
    return createPropertyAction(previous, formData);
  }, { error: null });

  function updateField(name: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function toggleSelection(value: string, selected: string[], update: (values: string[]) => void) {
    update(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function addCustomTagField() {
    setCustomTagFields((current) => [...current, { id: nextCustomTagId, value: "" }]);
    setNextCustomTagId((current) => current + 1);
  }

  function addCustomTag(id: number) {
    const tag = customTagFields.find((field) => field.id === id)?.value.trim() ?? "";
    if (!tag || selectedTags.includes(tag)) return;
    setSelectedTags((current) => [...current, tag]);
    setCustomTagFields((current) => current.map((field) => field.id === id ? { ...field, value: "" } : field));
  }

  function addPictureField() {
    if (pictureFields.length >= 8) return;
    setPictureFields((current) => [...current, { id: nextPictureId, file: null }]);
    setNextPictureId((current) => current + 1);
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => formAction(data)); }} className="mx-auto max-w-5xl space-y-6">
      <Link href="/" className="inline-flex items-center rounded-sm bg-neutral-light-grey px-3 py-2 text-sm text-neutral-black hover:text-brand-main-red">← Retour</Link>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-black">Ajouter une propriété</h1>
        <Button type="submit" disabled={pending}>{pending ? "Ajout en cours…" : "Ajouter"}</Button>
      </div>
      {state.error && <p role="alert" className="text-sm text-brand-main-red">{state.error}</p>}
      <div className="grid items-start gap-4 md:grid-cols-2">
        <section aria-label="Informations du logement" className="space-y-4 rounded-md border border-neutral-light-grey bg-neutral-white p-6 sm:p-10">
          <label className="block text-sm">Titre de la propriété<input name="title" required maxLength={150} value={fields.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ex : Appartement cosy au cœur de Paris" className={inputClass} /></label>
          <label className="block text-sm">Description<textarea name="description" rows={5} value={fields.description} onChange={(event) => updateField("description", event.target.value)} className={inputClass} placeholder="Décrivez votre propriété en détail…" /></label>
          <label className="block text-sm">Code postal<input name="postal_code" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} title="Code postal à 5 chiffres" value={fields.postal_code} onChange={(event) => updateField("postal_code", event.target.value)} className={inputClass} /></label>
          <label className="block text-sm">Localisation<input name="location" required value={fields.location} onChange={(event) => updateField("location", event.target.value)} className={inputClass} /></label>
          <label className="block text-sm">Prix par nuit (€)<input name="price_per_night" type="number" required min="1" step="1" value={fields.price_per_night} onChange={(event) => updateField("price_per_night", event.target.value)} className={inputClass} /></label>
        </section>
        <div className="space-y-4">
        <section aria-label="Photos du logement" className="space-y-5 rounded-md border border-neutral-light-grey bg-neutral-white p-6 sm:p-10">
          <div>
            <p className="mb-1 text-sm">Image de couverture</p>
            <div className="flex items-center gap-1">
              <ImageUploadField id="cover" label="Image de couverture" file={cover} onChange={setCover} ariaRequired previewLabel="Aperçu de la couverture" />
              {cover && <button type="button" aria-label="Retirer l’image de couverture" onClick={() => setCover(null)} className="h-6 shrink-0 px-1 text-brand-main-red">×</button>}
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm">Image du logement</p>
            <div className="space-y-1">
              {pictureFields.map(({ id, file }, index) => (
                <div key={id} className="flex items-center gap-1">
                  <ImageUploadField id={`picture-${id}`} label={`Image du logement ${index + 1}`} file={file} onChange={(selectedFile) => setPictureFields((current) => current.map((field) => field.id === id ? { ...field, file: selectedFile } : field))} />
                  {file && <button type="button" aria-label={`Retirer la photo ${index + 1}`} onClick={() => setPictureFields((current) => current.map((field) => field.id === id ? { ...field, file: null } : field))} className="h-6 shrink-0 px-1 text-brand-main-red">×</button>}
                </div>
              ))}
            </div>
            <button type="button" aria-label="Ajouter une image" onClick={addPictureField} disabled={pictureFields.length >= 8} className="mt-1 text-xs text-brand-main-red hover:underline disabled:cursor-not-allowed disabled:opacity-50">+ Ajouter une image</button>
          </div>
        </section>
        <section aria-label="Informations de l’hôte" className="space-y-5 rounded-md border border-neutral-light-grey bg-neutral-white p-6 sm:p-10">
          <label className="block text-sm">Nom de l’hôte<input name="host_name" value={fields.hostName} onChange={(event) => updateField("hostName", event.target.value)} className={inputClass} /></label>
          <div>
            <p className="mb-1 text-sm">Photo de profil</p>
            <ImageUploadField id="profile-picture" label="Photo de profil" file={profilePicture} onChange={setProfilePicture} inputRef={profilePictureInputRef} />
            <button type="button" onClick={() => profilePictureInputRef.current?.click()} className="mt-1 text-xs text-brand-main-red hover:underline">+ Ajouter une image</button>
          </div>
        </section>
        </div>
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
            <p>Ajouter une catégorie personnalisée</p>
            <div className="mt-1 space-y-2">
              {customTagFields.map(({ id, value }, index) => (
                <div key={id} className="flex items-end gap-2">
                  <input id={`customTag-${id}`} maxLength={80} aria-label={`Tag personnalisé ${index + 1}`} value={value} onChange={(event) => setCustomTagFields((current) => current.map((field) => field.id === id ? { ...field, value: event.target.value } : field))} placeholder="Nouveau tag" className={inputClass} />
                  <Button type="button" iconOnly icon={<PlusIcon className="size-4" />} aria-label="Ajouter ce tag" onClick={() => addCustomTag(id)} className="mb-0.5 shrink-0">Ajouter le tag</Button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCustomTagField} className="mt-1 text-xs text-brand-main-red hover:underline">+ Ajouter un tag</button>
          </div>
        </fieldset>
      </div>
    </form>
  );
}