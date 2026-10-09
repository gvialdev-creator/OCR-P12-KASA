"use client";

import Image from "next/image";
import { useState } from "react";
import type { MessageUser } from "@/features/messages/types";

export function messageInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return `${words.length > 1 ? Array.from(words[1])[0] : ""}${Array.from(words[0])[0]}`.toLocaleUpperCase("fr-FR");
}

export function validAvatarSource(source: string | null) {
  if (!source) return null;
  if (/^\/uploads\/[a-zA-Z0-9._/-]+$/.test(source) && !source.includes("..")) return source;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function AvatarImage({ source, name }: { source: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? messageInitials(name) : <Image src={source} alt="" fill unoptimized sizes="48px" className="object-cover" onError={() => setFailed(true)} />;
}

export function MessageAvatar({ user, small = false }: { user: MessageUser; small?: boolean }) {
  const source = validAvatarSource(user.picture);
  return <span role="img" aria-label={user.name} className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-dark-grey font-medium text-neutral-white ${small ? "size-8 text-xs" : "size-12 text-base"}`}>
    {source ? <AvatarImage key={source} source={source} name={user.name} /> : messageInitials(user.name)}
  </span>;
}