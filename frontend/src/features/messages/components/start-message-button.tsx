"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startConversationAction } from "@/features/messages/actions/messaging";

export function StartMessageButton({ recipientId, returnTo }: { recipientId: number; returnTo: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return <div>
    <Button className="w-full text-neutral-white" disabled={pending} onClick={() => startTransition(async () => {
      setError(null);
      const result = await startConversationAction(recipientId, returnTo);
      if (result) setError(result.error);
    })}>{pending ? "Ouverture..." : "Envoyer un message"}</Button>
    {error && <p role="alert" className="mt-2 text-sm text-brand-main-red">{error}</p>}
  </div>;
}