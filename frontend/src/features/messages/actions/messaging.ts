"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/api/errors";
import { messagingRequest } from "@/features/messages/services/messaging";
import { messagingLogin, messagingSession } from "@/features/messages/services/session";
import type { Conversation, ConversationPage, Message, MessagePage, MessagingResult, ReadState, SocketTicket } from "@/features/messages/types";

async function perform<T>(path: string, method = "GET", body?: unknown, returnTo = "/messages"): Promise<MessagingResult<T>> {
  const { token } = await messagingSession(returnTo);
  try { return { data: await messagingRequest<T>(path, token, method, body), error: null }; }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) messagingLogin(returnTo);
    return { data: null, error: error instanceof ApiError ? error.message : "La messagerie est indisponible. Réessayez." };
  }
}

function validId(id: number) { return Number.isSafeInteger(id) && id > 0; }

export async function startConversationAction(recipientId: number, returnTo: string) {
  const { user } = await messagingSession(returnTo);
  if (!validId(recipientId) || user.id === recipientId) return { error: "Vous ne pouvez pas démarrer cette conversation." };
  const result = await perform<Conversation>("/conversations", "POST", { recipient_id: recipientId }, returnTo);
  if (result.error !== null) return { error: result.error };
  redirect(`/messages/${result.data.id}`);
}

export async function listConversationsAction(before?: string): Promise<MessagingResult<ConversationPage>> {
  if (before !== undefined && (typeof before !== "string" || before.length > 256 || !/^[a-zA-Z0-9_-]+$/.test(before))) return { data: null, error: "Curseur invalide." };
  return perform(`/conversations?limit=30${before ? `&before=${encodeURIComponent(before)}` : ""}`);
}

export async function loadMessagesAction(id: number, options: { before?: number; after?: number } = {}): Promise<MessagingResult<MessagePage>> {
  if (!validId(id) || (options.before !== undefined && !validId(options.before)) || (options.after !== undefined && !validId(options.after)) || (options.before !== undefined && options.after !== undefined)) return { data: null, error: "Curseur invalide." };
  const query = new URLSearchParams({ limit: "100" });
  if (options.before) query.set("before", String(options.before));
  if (options.after) query.set("after", String(options.after));
  return perform(`/conversations/${id}/messages?${query}`, "GET", undefined, `/messages/${id}`);
}

export async function sendMessageAction(id: number, body: string, clientMessageId: string): Promise<MessagingResult<Message>> {
  if (!validId(id) || typeof body !== "string" || !body.trim() || body.length > 4000 || typeof clientMessageId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientMessageId)) return { data: null, error: "Le message doit contenir entre 1 et 4000 caractères." };
  return perform(`/conversations/${id}/messages`, "POST", { body, client_message_id: clientMessageId }, `/messages/${id}`);
}

export async function markReadAction(id: number, messageId: number): Promise<MessagingResult<ReadState>> {
  if (!validId(id) || !validId(messageId)) return { data: null, error: "Curseur invalide." };
  return perform(`/conversations/${id}/read`, "PATCH", { last_read_message_id: messageId }, `/messages/${id}`);
}

export async function socketTicketAction(): Promise<MessagingResult<SocketTicket>> {
  return perform("/messaging/socket-token", "POST");
}

export async function getConversationAction(id: number): Promise<MessagingResult<Conversation>> {
  if (!validId(id)) return { data: null, error: "Conversation invalide." };
  return perform(`/conversations/${id}`, "GET", undefined, `/messages/${id}`);
}