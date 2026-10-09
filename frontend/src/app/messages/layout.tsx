import type { Metadata } from "next";
import { ApiError } from "@/api/errors";
import { MessagesShell } from "@/features/messages/components/messages-shell";
import { messagingRequest } from "@/features/messages/services/messaging";
import { messagingSession } from "@/features/messages/services/session";
import type { ConversationPage } from "@/features/messages/types";

export const metadata: Metadata = { title: "Messages | Kasa", robots: { index: false, follow: false } };

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { user, token } = await messagingSession();
  let initialPage: ConversationPage = { conversations: [], next_cursor: null };
  let error: string | null = null;
  try { initialPage = await messagingRequest<ConversationPage>("/conversations", token); }
  catch (cause) { error = cause instanceof ApiError ? cause.message : "Impossible de charger les conversations."; }
  return <MessagesShell user={{ id: user.id, name: user.name, picture: user.picture }} initialPage={initialPage} initialError={error}>{children}</MessagesShell>;
}