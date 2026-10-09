import { notFound } from "next/navigation";
import { ApiError } from "@/api/errors";
import { ConversationView } from "@/features/messages/components/conversation-view";
import { messagingRequest } from "@/features/messages/services/messaging";
import { messagingLogin, messagingSession } from "@/features/messages/services/session";
import type { Conversation, MessagePage } from "@/features/messages/types";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  const { token } = await messagingSession(`/messages/${id}`);
  let data: [Conversation, MessagePage] | null = null;
  try {
    data = await Promise.all([
      messagingRequest<Conversation>(`/conversations/${id}`, token),
      messagingRequest<MessagePage>(`/conversations/${id}/messages`, token),
    ]);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status || 0)) notFound();
    if (error instanceof ApiError && error.status === 401) messagingLogin(`/messages/${id}`);
  }
  if (!data) return <div role="alert" className="p-6">Impossible de charger cette discussion. Actualisez la page pour réessayer.</div>;
  return <ConversationView key={id} conversation={data[0]} initialPage={data[1]} />;
}