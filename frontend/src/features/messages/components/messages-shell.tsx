"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, startTransition, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { listConversationsAction } from "@/features/messages/actions/messaging";
import { MessageAvatar } from "@/features/messages/components/message-avatar";
import { useMessagingSocket } from "@/features/messages/hooks/use-messaging-socket";
import { messageTime } from "@/features/messages/services/message-state";
import type { ConversationPage, MessagingEvent, MessageUser } from "@/features/messages/types";

const MessagingContext = createContext<{
  user: MessageUser;
  online: boolean;
  listeners: Set<(event: MessagingEvent) => void>;
  notify: (event: MessagingEvent) => void;
} | null>(null);

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) throw new Error("Messaging layout required");
  return context;
}

export function MessagesShell({ user, initialPage, initialError, children }: {
  user: MessageUser; initialPage: ConversationPage; initialError: string | null; children: ReactNode;
}) {
  const pathname = usePathname();
  const selected = /^\/messages\/\d+$/.test(pathname);
  const [page, setPage] = useState(initialPage);
  const [error, setError] = useState(initialError);
  const [pending, startLoading] = useTransition();
  const [listeners] = useState(() => new Set<(event: MessagingEvent) => void>());
  const refreshRunning = useRef(false);
  const refreshAgain = useRef(false);
  const mounted = useRef(true);
  const loadedCount = useRef(initialPage.conversations.length);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  function refreshList() {
    refreshAgain.current = true;
    if (refreshRunning.current) return;
    refreshRunning.current = true;
    startTransition(async () => {
      try {
        while (refreshAgain.current && mounted.current) {
          refreshAgain.current = false;
          const first = await listConversationsAction();
          if (!mounted.current) return;
          if (!first.data) { setError(first.error); return; }
          const updated = first.data;
          while (updated.next_cursor && updated.conversations.length < loadedCount.current) {
            const next = await listConversationsAction(updated.next_cursor);
            if (!next.data) break;
            updated.conversations.push(...next.data.conversations);
            updated.next_cursor = next.data.next_cursor;
          }
          if (mounted.current) { setPage(updated); setError(null); }
        }
      } catch { if (mounted.current) setError("Impossible d'actualiser les conversations."); }
      finally { refreshRunning.current = false; }
    });
  }

  function notify(event: MessagingEvent) {
    listeners.forEach((listener) => listener(event));
    refreshList();
  }
  const connection = useMessagingSocket(notify);

  function loadMore() {
    if (!page.next_cursor) return;
    startLoading(async () => {
      const next = await listConversationsAction(page.next_cursor!);
      if (!next.data) { setError(next.error); return; }
      const nextPage = next.data;
      setPage((current) => {
        const merged = new Map(current.conversations.map((conversation) => [conversation.id, conversation]));
        nextPage.conversations.forEach((conversation) => merged.set(conversation.id, conversation));
        const conversations = [...merged.values()];
        loadedCount.current = conversations.length;
        return { conversations, next_cursor: nextPage.next_cursor };
      });
    });
  }

  return <MessagingContext.Provider value={{ user, online: connection.online, listeners, notify }}>
    <main className="container-app my-6 flex min-h-0 flex-1 flex-col md:my-10">
      <div className="flex h-[min(760px,calc(100dvh-180px))] min-h-96 w-full overflow-hidden border-y border-neutral-dark-grey/15 bg-neutral-white md:min-h-120">
        <section aria-label="Conversations" className={`${selected ? "hidden md:flex" : "flex"} w-full min-w-0 flex-col md:w-[35%] md:border-r md:border-neutral-dark-grey/15`}>
          <div className="border-b border-neutral-dark-grey/15 px-4 py-5 md:px-6">
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm md:hidden"><ArrowLeftIcon className="size-4" />Retour vers accueil</Link>
            <h1 className="text-2xl font-semibold">Messages</h1>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error && <div role="alert" className="p-4 text-sm">{error}<button onClick={refreshList} className="ml-2 underline">Réessayer</button></div>}
            {!page.conversations.length && !error && <p className="p-6 text-sm text-neutral-dark-grey">Vous n&apos;avez pas encore de conversation.</p>}
            <ul>
              {page.conversations.map((conversation) => <li key={conversation.id}>
                <Link href={`/messages/${conversation.id}`} aria-current={pathname === `/messages/${conversation.id}` ? "page" : undefined}
                  className={`flex min-w-0 items-center gap-3 border-b border-neutral-dark-grey/10 px-4 py-5 hover:bg-brand-light-orange md:px-6 ${pathname === `/messages/${conversation.id}` ? "bg-brand-light-orange" : ""}`}>
                  <MessageAvatar user={conversation.peer} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2"><span className="truncate font-medium">{conversation.peer.name}</span><time className="shrink-0 text-xs text-neutral-dark-grey">{messageTime(conversation.last_message_at)}</time></span>
                    <span className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-sm text-neutral-dark-grey">{conversation.last_message?.body || "Aucun message"}</span>
                      {conversation.unread_count > 0 && <span className="size-2 shrink-0 rounded-full bg-brand-main-red" aria-label={`${conversation.unread_count} message(s) non lu(s)`} />}</span>
                  </span>
                </Link>
              </li>)}
            </ul>
            {page.next_cursor && <button disabled={pending} onClick={loadMore} className="w-full p-4 text-sm underline disabled:opacity-50">{pending ? "Chargement..." : "Conversations précédentes"}</button>}
          </div>
          {!connection.online && <div role="status" className="border-t border-neutral-dark-grey/15 px-4 py-3 text-xs text-neutral-dark-grey">{connection.error || "Connexion en cours..."}<button onClick={connection.retry} className="ml-2 underline">Reconnecter</button></div>}
        </section>
        <section aria-label="Discussion" className={`${selected ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-brand-light-orange md:w-[65%]`}>{children}</section>
      </div>
    </main>
  </MessagingContext.Provider>;
}